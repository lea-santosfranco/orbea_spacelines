import { prisma } from '../config/prisma.js';

export function listCategories({ type }) {
  return prisma.category.findMany({
    where: type ? { productType: type } : {},
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, productType: true },
  });
}
