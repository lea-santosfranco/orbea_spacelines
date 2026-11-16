import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import { uniqueSlug } from '../../utils/slugify.js';

export async function listAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [{ productType: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  });
  return categories.map(({ _count, ...category }) => ({ ...category, productCount: _count.products }));
}

export async function createCategory({ name, productType }) {
  const slug = await uniqueSlug(name, async (candidate) =>
    Boolean(await prisma.category.findUnique({ where: { slug: candidate } })),
  );
  return prisma.category.create({ data: { name, productType, slug } });
}

export async function updateCategory(id, { name }) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new HttpError(404, 'Catégorie introuvable');
  return prisma.category.update({ where: { id }, data: { name } });
}

// Une catégorie qui contient des produits ne peut pas être supprimée (la base l'interdit aussi : onDelete Restrict)
export async function deleteCategory(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new HttpError(404, 'Catégorie introuvable');
  if (category._count.products > 0) {
    throw new HttpError(409, 'Cette catégorie contient des produits : déplacez-les avant de la supprimer');
  }
  await prisma.category.delete({ where: { id } });
}
