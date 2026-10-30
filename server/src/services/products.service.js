import { prisma } from '../config/prisma.js';

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

export async function listProducts({ type, page, limit }) {
  const where = { isArchived: false, ...(type && { type }) };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
        variants: { where: { isActive: true }, select: { priceCents: true, stock: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map(toProductCard),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}