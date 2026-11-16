import crypto from 'node:crypto';
import argon2 from 'argon2';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/httpError.js';

async function checkPassword(user, password) {
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw new HttpError(400, 'Mot de passe incorrect');
}

export async function updateProfile(user, data) {
  if (data.email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email: data.email } });
    if (taken) throw new HttpError(409, 'Cette adresse e-mail est déjà utilisée');
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      address: data.address ?? null,
      postalCode: data.postalCode ?? null,
      city: data.city ?? null,
    },
  });
}

export async function changePassword(user, { currentPassword, newPassword }) {
  await checkPassword(user, currentPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await argon2.hash(newPassword) } });
}

// Droit d'accès et de portabilité (RGPD) : toutes les données personnelles du client, dans un format lisible (JSON)
export async function exportData(user) {
  const [orders, favorites, reviews] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { items: true },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.review.findMany({
      where: { userId: user.id },
      include: { product: { select: { name: true } } },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      postalCode: user.postalCode,
      city: user.city,
      createdAt: user.createdAt,
      consentAt: user.consentAt,
    },
    orders: orders.map((order) => ({
      number: order.number,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      totalCents: order.totalCents,
      shipping: order.shippingAddress
        ? {
            name: order.shippingName,
            address: order.shippingAddress,
            postalCode: order.shippingPostalCode,
            city: order.shippingCity,
          }
        : null,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantLabel: item.variantLabel,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
    })),
    favorites: favorites.map((favorite) => ({
      productName: favorite.product.name,
      addedAt: favorite.createdAt,
    })),
    reviews: reviews.map((review) => ({
      productName: review.product.name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  };
}

// Droit à l'effacement (RGPD) : les données personnelles sont effacées, mais les commandes sont
// conservées sous forme anonyme, car la comptabilité doit les garder 10 ans.
export async function deleteAccount(user, { password }) {
  await checkPassword(user, password);

  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { userId: user.id } }),
    prisma.review.deleteMany({ where: { userId: user.id } }), // Un avis est un contenu personnel : il est effacé
    prisma.cart.deleteMany({ where: { userId: user.id } }),
    prisma.order.updateMany({
      where: { userId: user.id },
      data: { shippingName: null, shippingAddress: null, shippingPostalCode: null, shippingCity: null },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: `supprime-${user.id}@anonyme.invalid`,
        firstName: 'Compte',
        lastName: 'supprimé',
        address: null,
        postalCode: null,
        city: null,
        // Mot de passe remplacé par une empreinte aléatoire : plus personne ne pourra se connecter
        passwordHash: await argon2.hash(crypto.randomBytes(32).toString('hex')),
        isActive: false,
        anonymizedAt: new Date(),
      },
    }),
  ]);
}
