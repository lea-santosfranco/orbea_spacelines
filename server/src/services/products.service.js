import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

export const cardInclude = {
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
  variants: { where: { isActive: true }, select: { priceCents: true, stock: true, departureDate: true } },
};

function startOfToday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

// Transforme un produit de la base en objet prêt pour une carte du catalogue
export function toProductCard(product) {
  const prices = product.variants.map((variant) => variant.priceCents);
  const today = startOfToday();
  // Prochain départ encore réservable (voyages uniquement)
  const upcoming = product.variants
    .filter((variant) => variant.departureDate && variant.departureDate >= today && variant.stock > 0)
    .map((variant) => variant.departureDate)
    .sort((a, b) => a - b);

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
    nextDepartureDate: upcoming[0] ? upcoming[0].toISOString().slice(0, 10) : null,
  };
}

// Construit le filtre Prisma (where) et les variantes à charger (include) à partir des critères de recherche.
// Les critères qui portent sur les variantes (prix, classe, dates, disponibilité) sont réunis dans un seul
// « some » : le produit est retenu s'il a AU MOINS UNE variante qui respecte TOUS ces critères à la fois.
function buildWhere({ type, q, category, available, minPrice, maxPrice, travelClass, departureFrom, departureTo }) {
  const variantFilter = {
    isActive: true,
    ...(available && { stock: { gt: 0 } }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      priceCents: {
        ...(minPrice !== undefined && { gte: minPrice * 100 }),
        ...(maxPrice !== undefined && { lte: maxPrice * 100 }),
      },
    }),
    ...(travelClass && { travelClass }),
    ...((departureFrom || departureTo) && {
      departureDate: {
        ...(departureFrom && { gte: new Date(departureFrom) }),
        ...(departureTo && { lte: new Date(departureTo) }),
      },
    }),
  };
  const hasVariantCriteria = Object.keys(variantFilter).length > 1;

  const where = {
    isArchived: false,
    ...(type && { type }),
    ...(category && { category: { slug: category } }),
    ...(q && {
      OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
    }),
    ...(hasVariantCriteria && { variants: { some: variantFilter } }),
  };

  // Les cartes sont calculées sur les seules variantes qui correspondent (ex. prix de la classe Première filtrée)
  const include = { ...cardInclude, variants: { ...cardInclude.variants, where: variantFilter } };
  return { where, include };
}

// Tri en mémoire sur une valeur calculée ; les produits sans valeur (null) sont toujours placés en fin de liste
function compareBy(key, direction) {
  return (a, b) => {
    if (a[key] === null) return 1;
    if (b[key] === null) return -1;
    const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return direction === 'asc' ? order : -order;
  };
}

const MEMORY_SORTS = {
  price_asc: compareBy('minPriceCents', 'asc'),
  price_desc: compareBy('minPriceCents', 'desc'),
  date: compareBy('nextDepartureDate', 'asc'), // voyages : départ le plus proche d'abord
};

export async function listProducts({ sort, page, limit, ...filters }) {
  const { where, include } = buildWhere(filters);
  const total = await prisma.product.count({ where });

  // Tri simple : la base fait le tri et la pagination.
  // « Nouveautés » (tri par date d'un goodie) = date de création, aussi gérée par la base.
  const databaseOrder =
    sort === 'default' ? { id: 'asc' } : sort === 'date' && filters.type === 'GOODIE' ? { createdAt: 'desc' } : null;

  let items;
  if (databaseOrder) {
    const products = await prisma.product.findMany({
      where,
      orderBy: databaseOrder,
      skip: (page - 1) * limit,
      take: limit,
      include,
    });
    items = products.map(toProductCard);
  } else {
    // Prix minimum et prochain départ sont calculés sur les variantes : Prisma ne sait pas trier dessus.
    // Le catalogue étant petit (quelques dizaines de produits), on trie en mémoire puis on découpe la page.
    const products = await prisma.product.findMany({ where, include });
    items = products
      .map(toProductCard)
      .sort(MEMORY_SORTS[sort])
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
