import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { cardInclude, toProductCard } from './products.service.js';

// Favoris du client, sous forme de cartes produit (les produits archivés sont retirés de l'affichage)
export async function listFavorites(user) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, product: { isArchived: false } },
    orderBy: { createdAt: 'desc' },
    include: { product: { include: cardInclude } },
  });
  return favorites.map((favorite) => toProductCard(favorite.product));
}

export async function addFavorite(user, productId) {
  const product = await prisma.product.findFirst({ where: { id: productId, isArchived: false } });
  if (!product) throw new HttpError(404, 'Produit introuvable');

  // upsert : ajouter deux fois le même favori ne crée pas de doublon (clé primaire userId + productId)
  await prisma.favorite.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId },
    update: {},
  });
}

export async function removeFavorite(user, productId) {
  await prisma.favorite.deleteMany({ where: { userId: user.id, productId } });
}
