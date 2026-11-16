import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { variantLabel } from '../utils/variantLabel.js';
import { MAX_QUANTITY_PER_LINE } from '../validators/cart.validator.js';

// Un panier appartient soit à un client connecté (userId), soit à un visiteur (jeton stocké dans un cookie).
// « owner » vaut donc { userId } ou { token }.

export function createCartToken() {
  // 32 octets aléatoires : impossible à deviner, donc impossible de lire le panier d'un autre visiteur
  return crypto.randomBytes(32).toString('base64url');
}

function ownerWhere(owner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.token) return { sessionToken: owner.token };
  return null;
}

async function findCart(owner) {
  const where = ownerWhere(owner);
  return where ? prisma.cart.findUnique({ where }) : null;
}

async function getOrCreateCart(owner) {
  const existing = await findCart(owner);
  if (existing) return existing;
  return prisma.cart.create({
    data: owner.userId ? { userId: owner.userId } : { sessionToken: owner.token },
  });
}

// Quantité maximale autorisée pour une variante : son stock, plafonné par la limite par ligne
function maxQuantity(variant) {
  return Math.min(variant.stock, MAX_QUANTITY_PER_LINE);
}

function stockMessage(variant) {
  const unit = variant.departureDate ? 'place' : 'article';
  if (variant.stock === 0) {
    return variant.departureDate ? 'Ce départ est complet' : 'Cet article est épuisé';
  }
  const max = maxQuantity(variant);
  return `Quantité maximale pour cette sélection : ${max} ${unit}${max > 1 ? 's' : ''}`;
}

// Vérifie qu'une variante peut être achetée (active, produit en ligne)
async function findPurchasableVariant(variantId) {
  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    include: { product: { select: { isArchived: true } } },
  });

  if (!variant || !variant.isActive || variant.product.isArchived) {
    throw new HttpError(404, "Ce produit n'est plus disponible");
  }
  return variant;
}

// ---------- Lecture ----------

const emptyCart = { items: [], itemCount: 0, subtotalCents: 0, hasIssues: false };

// Panier prêt à afficher : lignes détaillées, totaux, et signalement des lignes devenues invalides
export async function getCartView(owner) {
  const cart = await findCart(owner);
  if (!cart) return emptyCart;

  const lines = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { id: 'asc' },
    include: {
      variant: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              type: true,
              isArchived: true,
              images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
            },
          },
        },
      },
    },
  });

  const items = lines.map(({ quantity, variant }) => {
    const { product } = variant;
    const isAvailable = variant.isActive && !product.isArchived && variant.stock > 0;

    let issue = null;
    if (!isAvailable)
      issue = variant.departureDate
        ? 'Ce départ est complet ou n’est plus proposé'
        : 'Cet article n’est plus disponible';
    else if (quantity > variant.stock) issue = `Il ne reste que ${variant.stock} en stock : ajustez la quantité`;

    return {
      variantId: variant.id,
      productName: product.name,
      productSlug: product.slug,
      productType: product.type,
      image: product.images[0] ?? null,
      variantLabel: variantLabel(variant),
      unitPriceCents: variant.priceCents,
      quantity,
      maxQuantity: maxQuantity(variant),
      lineTotalCents: variant.priceCents * quantity,
      issue,
    };
  });

  // Les lignes en erreur ne comptent pas dans le total : elles devront être corrigées avant le paiement
  const validItems = items.filter((item) => !item.issue);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents: validItems.reduce((sum, item) => sum + item.lineTotalCents, 0),
    hasIssues: items.some((item) => item.issue),
  };
}

// ---------- Modification ----------

export async function addItem(owner, { variantId, quantity }) {
  const variant = await findPurchasableVariant(variantId);
  const cart = await getOrCreateCart(owner);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  // Le stock n'est pas réservé à l'ajout : il sera vérifié une nouvelle fois au moment du paiement
  if (newQuantity > maxQuantity(variant)) {
    throw new HttpError(409, stockMessage(variant));
  }

  // Une variante n'apparaît qu'une fois par panier : on augmente la quantité si elle y est déjà
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity: newQuantity },
    update: { quantity: newQuantity },
  });
}

export async function updateItem(owner, variantId, quantity) {
  const cart = await findCart(owner);
  const line =
    cart && (await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } }));
  if (!line) throw new HttpError(404, 'Article absent du panier');

  const variant = await findPurchasableVariant(variantId);
  if (quantity > maxQuantity(variant)) {
    throw new HttpError(409, stockMessage(variant));
  }

  await prisma.cartItem.update({ where: { id: line.id }, data: { quantity } });
}

export async function removeItem(owner, variantId) {
  const cart = await findCart(owner);
  if (!cart) return;
  // deleteMany ne lève pas d'erreur si la ligne n'existe déjà plus
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
}

// ---------- Connexion ----------

// À la connexion, le panier du visiteur rejoint celui du compte.
// Si un article est dans les deux, les quantités s'additionnent, dans la limite du stock.
export async function mergeVisitorCart(token, userId) {
  if (!token) return;

  const visitorCart = await prisma.cart.findUnique({
    where: { sessionToken: token },
    include: { items: { include: { variant: true } } },
  });
  if (!visitorCart) return;

  await prisma.$transaction(async (tx) => {
    const userCart = (await tx.cart.findUnique({ where: { userId } })) ?? (await tx.cart.create({ data: { userId } }));

    for (const item of visitorCart.items) {
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      const merged = Math.min((existing?.quantity ?? 0) + item.quantity, maxQuantity(item.variant));
      if (merged < 1) continue;

      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        create: { cartId: userCart.id, variantId: item.variantId, quantity: merged },
        update: { quantity: merged },
      });
    }

    // Le panier visiteur a été versé dans celui du compte : il n'a plus de raison d'exister
    await tx.cart.delete({ where: { id: visitorCart.id } });
  });
}
