import argon2 from 'argon2';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

export const PASSWORD = 'Mot-de-passe-test-1';

// Vide toutes les tables et remet les compteurs d'identifiants à 1
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE favorites, cart_items, carts, order_items, orders, product_images, variants, products, categories, users RESTART IDENTITY CASCADE',
  );
}

// Jeu de données minimal et connu : un admin, un client, un voyage (2 départs) et un goodie (2 tailles)
export async function seedTestData() {
  const passwordHash = await argon2.hash(PASSWORD);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.fr',
      passwordHash,
      firstName: 'Ada',
      lastName: 'Admin',
      role: 'ADMIN',
      consentAt: new Date(),
    },
  });
  const client = await prisma.user.create({
    data: { email: 'client@test.fr', passwordHash, firstName: 'Cléo', lastName: 'Client', consentAt: new Date() },
  });

  const lune = await prisma.category.create({ data: { name: 'Lune', slug: 'lune', productType: 'TRIP' } });
  const vetements = await prisma.category.create({
    data: { name: 'Vêtements', slug: 'vetements', productType: 'GOODIE' },
  });

  const trip = await prisma.product.create({
    data: {
      type: 'TRIP',
      categoryId: lune.id,
      name: 'Survol lunaire',
      slug: 'survol-lunaire',
      description: 'Un tour de la Lune.',
      durationDays: 6,
      variants: {
        create: [
          { departureDate: new Date('2030-05-18'), travelClass: 'ECONOMY', priceCents: 18000000, stock: 3 },
          { departureDate: new Date('2030-05-18'), travelClass: 'FIRST', priceCents: 45000000, stock: 0 },
        ],
      },
    },
    include: { variants: { orderBy: { id: 'asc' } } },
  });

  const goodie = await prisma.product.create({
    data: {
      type: 'GOODIE',
      categoryId: vetements.id,
      name: 'T-shirt Orbéa',
      slug: 't-shirt-orbea',
      description: 'T-shirt en coton bio.',
      variants: {
        create: [
          { size: 'M', priceCents: 2900, stock: 5 },
          { size: 'L', priceCents: 2900, stock: 1 },
        ],
      },
    },
    include: { variants: { orderBy: { id: 'asc' } } },
  });

  return { admin, client, trip, goodie, categories: { lune, vetements } };
}

// Agent supertest qui garde les cookies (comme un navigateur), éventuellement déjà connecté
export async function agent(email) {
  const session = request.agent(app);
  if (email) {
    const response = await session.post('/api/auth/login').send({ email, password: PASSWORD });
    if (response.status !== 200) throw new Error(`Connexion impossible pour ${email}`);
  }
  return session;
}

export { app, prisma };
