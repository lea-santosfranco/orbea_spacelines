import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import { uniqueSlug } from '../../utils/slugify.js';
import { checkVariantsMatchType } from '../../validators/admin/products.validator.js';

export const UPLOADS_DIR = path.resolve('uploads');

// ---------- Lecture ----------

export async function listAdminProducts({ type, archived, q, page, limit }) {
  const where = {
    isArchived: archived,
    ...(type && { type }),
    ...(q && { name: { contains: q, mode: 'insensitive' } }),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { position: 'asc' }, take: 1, select: { url: true, altText: true } },
        variants: { where: { isActive: true }, select: { priceCents: true, stock: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      type: product.type,
      category: product.category.name,
      image: product.images[0] ?? null,
      isArchived: product.isArchived,
      variantCount: product.variants.length,
      totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
      minPriceCents: product.variants.length
        ? Math.min(...product.variants.map((variant) => variant.priceCents))
        : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

function toAdminProduct(product) {
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      departureDate: variant.departureDate ? variant.departureDate.toISOString().slice(0, 10) : null,
    })),
  };
}

const detailInclude = {
  category: { select: { id: true, name: true } },
  images: { orderBy: { position: 'asc' } },
  variants: { orderBy: [{ departureDate: 'asc' }, { travelClass: 'asc' }, { id: 'asc' }] },
};

export async function getAdminProduct(id) {
  const product = await prisma.product.findUnique({ where: { id }, include: detailInclude });
  if (!product) throw new HttpError(404, 'Produit introuvable');
  return toAdminProduct(product);
}

// ---------- Écriture ----------

async function checkCategory(categoryId, type) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.productType !== type) {
    throw new HttpError(400, 'Catégorie invalide pour ce type de produit');
  }
}

// Ne garde que les champs utiles au type de produit (pas de taille sur un voyage, pas de date sur un goodie)
function variantData(type, variant) {
  return {
    departureDate: type === 'TRIP' ? new Date(variant.departureDate) : null,
    travelClass: type === 'TRIP' ? variant.travelClass : null,
    size: type === 'GOODIE' ? variant.size : null,
    priceCents: variant.priceCents,
    stock: variant.stock,
    isActive: variant.isActive,
  };
}

export async function createProduct(data) {
  await checkCategory(data.categoryId, data.type);
  const slug = await uniqueSlug(data.name, async (candidate) =>
    Boolean(await prisma.product.findUnique({ where: { slug: candidate } })),
  );

  const product = await prisma.product.create({
    data: {
      type: data.type,
      categoryId: data.categoryId,
      name: data.name,
      slug,
      description: data.description,
      durationDays: data.type === 'TRIP' ? data.durationDays : null,
      variants: { create: data.variants.map((variant) => variantData(data.type, variant)) },
    },
  });
  return getAdminProduct(product.id);
}

export async function updateProduct(id, data) {
  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!existing) throw new HttpError(404, 'Produit introuvable');

  // Mêmes règles qu'à la création, avec le type enregistré en base
  const issues = [];
  checkVariantsMatchType({ ...data, type: existing.type }, { addIssue: (issue) => issues.push(issue) });
  if (issues.length > 0) throw new HttpError(400, issues[0].message);

  await checkCategory(data.categoryId, existing.type);

  const existingIds = new Set(existing.variants.map((variant) => variant.id));
  const sentIds = new Set(data.variants.filter((variant) => variant.id).map((variant) => variant.id));
  if ([...sentIds].some((variantId) => !existingIds.has(variantId))) {
    throw new HttpError(400, "Une variante n'appartient pas à ce produit");
  }

  // Une variante retirée du formulaire est désactivée, jamais supprimée : d'anciennes commandes peuvent y faire référence
  const removedIds = [...existingIds].filter((variantId) => !sentIds.has(variantId));

  await prisma.$transaction([
    prisma.variant.updateMany({ where: { id: { in: removedIds } }, data: { isActive: false } }),
    prisma.product.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        durationDays: existing.type === 'TRIP' ? data.durationDays : null,
      },
    }),
    ...data.variants.map((variant) =>
      variant.id
        ? prisma.variant.update({ where: { id: variant.id }, data: variantData(existing.type, variant) })
        : prisma.variant.create({ data: { productId: id, ...variantData(existing.type, variant) } }),
    ),
  ]);

  return getAdminProduct(id);
}

// Archiver masque le produit du site sans le supprimer (il reste lié aux anciennes commandes)
export async function setArchived(id, isArchived) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new HttpError(404, 'Produit introuvable');
  await prisma.product.update({ where: { id }, data: { isArchived } });
  return getAdminProduct(id);
}

// ---------- Images ----------

export async function addImage(productId, file, altText) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    await fs.rm(file.path, { force: true });
    throw new HttpError(404, 'Produit introuvable');
  }

  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { position: 'desc' } });
  await prisma.productImage.create({
    data: {
      productId,
      url: `/uploads/products/${file.filename}`,
      altText,
      position: (last?.position ?? -1) + 1,
    },
  });
  return getAdminProduct(productId);
}

export async function deleteImage(productId, imageId) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) throw new HttpError(404, 'Image introuvable');

  await prisma.productImage.delete({ where: { id: image.id } });

  // Seuls les fichiers envoyés par l'admin sont supprimés du disque ; path.basename empêche de sortir du dossier
  if (image.url.startsWith('/uploads/products/')) {
    await fs.rm(path.join(UPLOADS_DIR, 'products', path.basename(image.url)), { force: true });
  }
  return getAdminProduct(productId);
}

// Fait passer une image en première position (image principale des cartes)
export async function setMainImage(productId, imageId) {
  const images = await prisma.productImage.findMany({ where: { productId }, orderBy: { position: 'asc' } });
  if (!images.some((image) => image.id === imageId)) throw new HttpError(404, 'Image introuvable');

  const ordered = [images.find((image) => image.id === imageId), ...images.filter((image) => image.id !== imageId)];
  await prisma.$transaction(
    ordered.map((image, position) => prisma.productImage.update({ where: { id: image.id }, data: { position } })),
  );
  return getAdminProduct(productId);
}
