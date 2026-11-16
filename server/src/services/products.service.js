import { prisma } from '../config/prisma.js';

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
