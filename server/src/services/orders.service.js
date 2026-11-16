import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { config } from '../config/env.js';
import { stripe } from '../config/stripe.js';
import { HttpError } from '../utils/httpError.js';
import { variantLabel } from '../utils/variantLabel.js';

// Stripe refuse les paiements au-delà de 8 chiffres en centimes, soit 999 999,99 €
const STRIPE_MAX_AMOUNT_CENTS = 99_999_999;

// Durée de validité de la page de paiement Stripe (30 minutes, le minimum accepté par Stripe)
const CHECKOUT_EXPIRATION_SECONDS = 30 * 60;

class StockUnavailableError extends Error {}

// Numéro lisible et unique, ex. ORB-20261116-4F9A2C
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ORB-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function toPublicOrder(order) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    shipping: order.shippingAddress
      ? {
          name: order.shippingName,
          address: order.shippingAddress,
          postalCode: order.shippingPostalCode,
          city: order.shippingCity,
        }
      : null,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantLabel: item.variantLabel,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.unitPriceCents * item.quantity,
    })),
  };
}

// ---------- Création de la commande et de la session de paiement ----------

export async function createCheckout(user, { shipping }) {
  if (!stripe) {
    throw new HttpError(503, 'Le paiement en ligne est momentanément indisponible');
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        orderBy: { id: 'asc' },
        include: { variant: { include: { product: { select: { name: true, type: true, isArchived: true } } } } },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new HttpError(409, 'Votre panier est vide');
  }

  // Le stock est revérifié juste avant le paiement : il a pu changer depuis l'ajout au panier
  const unavailable = cart.items.filter(
    ({ variant, quantity }) => !variant.isActive || variant.product.isArchived || variant.stock < quantity,
  );
  if (unavailable.length > 0) {
    throw new HttpError(409, 'Certains articles ne sont plus disponibles. Vérifiez votre panier.');
  }

  const hasGoodies = cart.items.some(({ variant }) => variant.product.type === 'GOODIE');
  if (hasGoodies && !shipping) {
    throw new HttpError(400, 'Une adresse de livraison est nécessaire pour les goodies');
  }

  // Les noms, libellés et prix sont COPIÉS dans la commande : elle reste juste même si le catalogue change ensuite
  const items = cart.items.map(({ variant, quantity }) => ({
    variantId: variant.id,
    productName: variant.product.name,
    variantLabel: variantLabel(variant),
    unitPriceCents: variant.priceCents,
    quantity,
  }));

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const shippingCents = 0; // Livraison offerte
  const totalCents = subtotalCents + shippingCents;

  if (totalCents > STRIPE_MAX_AMOUNT_CENTS) {
    throw new HttpError(
      409,
      'Le paiement en ligne est limité à 999 999,99 € par commande. Répartissez vos réservations en plusieurs commandes.',
    );
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      number: generateOrderNumber(),
      status: 'PENDING_PAYMENT',
      subtotalCents,
      shippingCents,
      totalCents,
      ...(hasGoodies && {
        shippingName: shipping.name,
        shippingAddress: shipping.address,
        shippingPostalCode: shipping.postalCode,
        shippingCity: shipping.city,
      }),
      items: { create: items },
    },
  });

  let session;
  try {
    // Le montant est calculé ici, côté serveur, à partir de la base : jamais à partir de ce qu'envoie le navigateur
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr',
      customer_email: user.email,
      client_reference_id: String(order.id),
      metadata: { orderId: String(order.id) },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: item.unitPriceCents,
          product_data: { name: item.productName, description: item.variantLabel },
        },
      })),
      success_url: `${config.clientUrl}/commande/confirmation?commande=${order.id}`,
      cancel_url: `${config.clientUrl}/commande?paiement=annule`,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRATION_SECONDS,
    });
  } catch (error) {
    // Stripe injoignable ou requête refusée : la commande ne pourra jamais être payée, on l'annule
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    console.error(error);
    throw new HttpError(502, 'Le service de paiement est indisponible. Réessayez dans quelques instants.');
  }

  await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });

  return { orderId: order.id, url: session.url };
}

// ---------- Validation du paiement ----------

// Passe la commande à « Payée », décrémente le stock et retire les articles du panier.
// Peut être appelée plusieurs fois (webhook + page de confirmation) : seul le premier appel agit.
export async function fulfillOrder(orderId, paymentIntentId) {
  try {
    await prisma.$transaction(async (tx) => {
      // La condition sur le statut garantit qu'un seul appel « gagne », même si deux arrivent en même temps
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING_PAYMENT' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (claimed.count === 0) return;

      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });

      for (const item of order.items) {
        // Décrément conditionnel : le stock ne peut jamais devenir négatif
        const updated = await tx.variant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) throw new StockUnavailableError();
      }

      // Les articles achetés quittent le panier du client
      await tx.cartItem.deleteMany({
        where: { cart: { userId: order.userId }, variantId: { in: order.items.map((item) => item.variantId) } },
      });
    });
  } catch (error) {
    if (!(error instanceof StockUnavailableError)) throw error;

    // La dernière place a été vendue entre-temps : la transaction est annulée, la commande aussi, et le client remboursé
    await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
    if (paymentIntentId && stripe) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
  }
}

async function cancelPendingOrder(orderId) {
  await prisma.order.updateMany({ where: { id: orderId, status: 'PENDING_PAYMENT' }, data: { status: 'CANCELLED' } });
}

// Traite une session Checkout renvoyée par Stripe (webhook ou vérification directe)
async function applyCheckoutSession(session) {
  const orderId = Number(session.metadata?.orderId);
  if (!orderId) return;

  if (session.status === 'complete' && session.payment_status === 'paid') {
    await fulfillOrder(orderId, session.payment_intent);
  } else if (session.status === 'expired') {
    await cancelPendingOrder(orderId);
  }
}

// Événements envoyés par Stripe au webhook (signature déjà vérifiée par le contrôleur)
export async function handleStripeEvent(event) {
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
    await applyCheckoutSession(event.data.object);
  }
}

// ---------- Consultation ----------

export async function getOrderForUser(user, orderId) {
  // La condition sur userId empêche un client de lire la commande d'un autre
  let order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
  if (!order) throw new HttpError(404, 'Commande introuvable');

  // Si le webhook n'est pas encore arrivé (ou n'est pas configuré en local), on demande directement à Stripe
  if (order.status === 'PENDING_PAYMENT' && order.stripeSessionId && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      await applyCheckoutSession(session);
      order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    } catch (error) {
      // Stripe injoignable : on renvoie la commande telle quelle, la page réessaiera
      console.error(error);
    }
  }

  return toPublicOrder(order);
}

// Historique du client : seules les commandes réellement payées (les tentatives de paiement abandonnées n'en sont pas)
export async function listOrdersForUser(user, { page, limit }) {
  const where = { userId: user.id, paidAt: { not: null } };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { items: { select: { productName: true, quantity: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: orders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      productNames: [...new Set(order.items.map((item) => item.productName))],
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
