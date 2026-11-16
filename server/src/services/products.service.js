import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

const cardInclude = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
  variants: { where: { isActive: true }, select: { priceCents: true, stock: true } },
};

// Transforme un produit de la base en objet prêt pour une carte du catalogue
function toProductCard(product) {
  const prices = product.variants.map((variant) => variant.priceCents);

  return {
    id: product.id,
    slug: product.slug,
    type: product.type,
    name: product.name,
    durationDays: product.durationDays,
    category: product.category,
    image: product.images[0] ?? null,
    minPriceCents: prices.length > 0 ? Math.min(...prices) : null,
    // Permet d'afficher « À partir de » seulement quand les variantes n'ont pas toutes le même prix
    hasPriceRange: new Set(prices).size > 1,
    isAvailable: product.variants.some((variant) => variant.stock > 0),
  };
}

// Construit le filtre Prisma à partir des critères de recherche
function buildWhere({ type, q, category, available }) {
  return {
    isArchived: false,
    ...(type && { type }),
    ...(category && { category: { slug: category } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(available && { variants: { some: { isActive: true, stock: { gt: 0 } } } }),
  };
}

// Les produits sans prix (aucune variante active) sont toujours placés en fin de liste
function compareByPrice(direction) {
  return (a, b) => {
    if (a.minPriceCents === null) return 1;
    if (b.minPriceCents === null) return -1;
    return direction === 'asc' ? a.minPriceCents - b.minPriceCents : b.minPriceCents - a.minPriceCents;
  };
}

export async function listProducts({ type, q, category, sort, available, page, limit }) {
  const where = buildWhere({ type, q, category, available });
  const total = await prisma.product.count({ where });

  let items;

  if (sort === 'default') {
    // Tri simple : la base fait la pagination
    const products = await prisma.product.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: cardInclude,
    });
    items = products.map(toProductCard);
  } else {
    // Le prix minimum est calculé sur les variantes : Prisma ne sait pas trier dessus.
    // Le catalogue étant petit (quelques dizaines de produits), on trie en mémoire puis on découpe la page.
    const products = await prisma.product.findMany({ where, include: cardInclude });
    const direction = sort === 'price_asc' ? 'asc' : 'desc';
    items = products
      .map(toProductCard)
      .sort(compareByPrice(direction))
      .slice((page - 1) * limit, page * limit);
  }

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

function startOfToday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

// Fiche produit complète : toutes les images et toutes les variantes actives
export async function getProductBySlug(slug) {
  const product = await prisma.product.findFirst({
    where: { slug, isArchived: false },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { position: 'asc' }, select: { id: true, url: true, altText: true } },
      variants: {
        // Variantes actives, sans les départs déjà passés
        where: { isActive: true, OR: [{ departureDate: null }, { departureDate: { gte: startOfToday() } }] },
        // Les classes sont triées dans l'ordre de l'énumération : Économie, Affaires, Première
        orderBy: [{ departureDate: 'asc' }, { travelClass: 'asc' }, { id: 'asc' }],
        select: { id: true, departureDate: true, travelClass: true, size: true, priceCents: true, stock: true },
      },
    },
  });

  if (!product) {
    throw new HttpError(404, 'Produit introuvable');
  }

  const prices = product.variants.map((variant) => variant.priceCents);

  return {
    id: product.id,
    slug: product.slug,
    type: product.type,
    name: product.name,
    description: product.description,
    durationDays: product.durationDays,
    category: product.category,
    images: product.images,
    variants: product.variants.map((variant) => ({
      ...variant,
      // Date seule (AAAA-MM-JJ) : évite les décalages de fuseau horaire côté navigateur
      departureDate: variant.departureDate ? variant.departureDate.toISOString().slice(0, 10) : null,
    })),
    minPriceCents: prices.length > 0 ? Math.min(...prices) : null,
    hasPriceRange: new Set(prices).size > 1,
    isAvailable: product.variants.some((variant) => variant.stock > 0),
  };
}
