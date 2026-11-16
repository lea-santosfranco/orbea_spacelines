import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

const PAID_STATUSES = ['PAID', 'SHIPPED', 'COMPLETED'];

async function findProduct(slug) {
  const product = await prisma.product.findFirst({ where: { slug, isArchived: false }, select: { id: true } });
  if (!product) throw new HttpError(404, 'Produit introuvable');
  return product;
}

// Le client a-t-il payé une commande contenant ce produit (n'importe quelle variante) ?
async function hasPurchased(userId, productId) {
  const item = await prisma.orderItem.findFirst({
    where: { order: { userId, status: { in: PAID_STATUSES } }, variant: { productId } },
    select: { id: true },
  });
  return Boolean(item);
}

// Seuls le prénom et l'initiale du nom sont affichés publiquement (minimisation des données)
function authorName(user) {
  if (user.anonymizedAt) return 'Client';
  return `${user.firstName} ${user.lastName.charAt(0)}.`;
}

export async function listReviews(slug, user) {
  const product = await findProduct(slug);

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true, anonymizedAt: true } } },
  });

  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / count) * 10) / 10
    : null;
  const alreadyReviewed = Boolean(user && reviews.some((review) => review.userId === user.id));

  return {
    average,
    count,
    // Le formulaire n'est proposé qu'à un client connecté, qui a acheté le produit et ne l'a pas encore noté
    canReview: Boolean(user) && !alreadyReviewed && (await hasPurchased(user.id, product.id)),
    items: reviews.map((review) => ({
      id: review.id,
      author: authorName(review.user),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      isMine: Boolean(user) && review.userId === user.id,
    })),
  };
}

export async function createReview(user, slug, { rating, comment }) {
  const product = await findProduct(slug);

  if (!(await hasPurchased(user.id, product.id))) {
    throw new HttpError(403, 'Seuls les clients ayant acheté ce produit peuvent laisser un avis');
  }

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });
  if (existing) throw new HttpError(409, 'Vous avez déjà laissé un avis sur ce produit');

  await prisma.review.create({ data: { userId: user.id, productId: product.id, rating, comment } });
  return listReviews(slug, user);
}

export async function deleteMyReview(user, slug) {
  const product = await findProduct(slug);
  await prisma.review.deleteMany({ where: { userId: user.id, productId: product.id } });
  return listReviews(slug, user);
}

// Modération : un administrateur peut retirer n'importe quel avis
export async function deleteReviewById(id) {
  const { count } = await prisma.review.deleteMany({ where: { id } });
  if (count === 0) throw new HttpError(404, 'Avis introuvable');
}
