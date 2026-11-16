import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { agent, app, prisma, resetDatabase, seedTestData } from './helpers.js';

let data;
let admin;
beforeAll(async () => {
  await resetDatabase();
  data = await seedTestData();
  admin = await agent('admin@test.fr');
});

describe('Accès à l’administration', () => {
  it('renvoie 401 à un visiteur et 403 à un client', async () => {
    await request(app).get('/api/admin/products').expect(401);
    const client = await agent('client@test.fr');
    await client.get('/api/admin/products').expect(403);
    await client.get('/api/admin/stats').expect(403);
  });
});

describe('Gestion des produits', () => {
  const trip = (overrides = {}) => ({
    type: 'TRIP',
    categoryId: data.categories.lune.id,
    name: 'Nuit à Copernic',
    description: 'Une nuit sous le dôme du cratère.',
    durationDays: 5,
    variants: [{ departureDate: '2031-01-10', travelClass: 'ECONOMY', priceCents: 100000, stock: 4 }],
    ...overrides,
  });

  it('valide les règles métier (durée, catégorie, stock, doublons)', async () => {
    await admin
      .post('/api/admin/products')
      .send(trip({ durationDays: null }))
      .expect(400);
    await admin
      .post('/api/admin/products')
      .send(trip({ categoryId: data.categories.vetements.id }))
      .expect(400);
    const negative = trip({
      variants: [{ departureDate: '2031-01-10', travelClass: 'ECONOMY', priceCents: 1, stock: -1 }],
    });
    await admin.post('/api/admin/products').send(negative).expect(400);
    const duplicated = trip({
      variants: [
        { departureDate: '2031-01-10', travelClass: 'ECONOMY', priceCents: 1, stock: 1 },
        { departureDate: '2031-01-10', travelClass: 'ECONOMY', priceCents: 2, stock: 1 },
      ],
    });
    await admin.post('/api/admin/products').send(duplicated).expect(400);
  });

  it('crée un produit avec un slug unique sans accents', async () => {
    const response = await admin.post('/api/admin/products').send(trip());
    expect(response.status).toBe(201);
    expect(response.body.slug).toBe('nuit-a-copernic');
    const second = await admin.post('/api/admin/products').send(trip());
    expect(second.body.slug).toBe('nuit-a-copernic-2');
  });

  it('désactive (sans supprimer) une variante retirée du formulaire', async () => {
    const product = await prisma.product.findUnique({
      where: { slug: 'nuit-a-copernic' },
      include: { variants: true },
    });
    const response = await admin.put(`/api/admin/products/${product.id}`).send({
      categoryId: data.categories.lune.id,
      name: product.name,
      description: product.description,
      durationDays: 5,
      variants: [{ departureDate: '2031-02-01', travelClass: 'FIRST', priceCents: 300000, stock: 2 }],
    });
    expect(response.status).toBe(200);
    expect(response.body.variants.find((v) => v.id === product.variants[0].id).isActive).toBe(false);
  });

  it('refuse un fichier qui n’est pas vraiment une image', async () => {
    const response = await admin
      .post(`/api/admin/products/${data.goodie.id}/images`)
      .field('altText', 'Fausse image')
      .attach('image', Buffer.from('<?php echo 1; ?>'), { filename: 'piege.png', contentType: 'image/png' });
    expect(response.status).toBe(400);
  });
});

describe('Commandes et utilisateurs', () => {
  it('n’autorise que les transitions de statut prévues', async () => {
    const order = await prisma.order.create({
      data: {
        userId: data.client.id,
        number: 'ORB-TEST-0001',
        status: 'PAID',
        paidAt: new Date(),
        subtotalCents: 18000000,
        totalCents: 18000000,
        items: {
          create: [
            {
              variantId: data.trip.variants[0].id,
              productName: 'Survol lunaire',
              variantLabel: 'Test',
              unitPriceCents: 18000000,
              quantity: 1,
            },
          ],
        },
      },
    });
    // Voyage seul : pas d'expédition possible
    await admin.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'SHIPPED' }).expect(409);
    await admin.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'COMPLETED' }).expect(200);
    await admin.patch(`/api/admin/orders/${order.id}/status`).send({ status: 'CANCELLED' }).expect(409);
  });

  it('empêche un admin de désactiver son propre compte, et bloque la connexion d’un compte désactivé', async () => {
    await admin.patch(`/api/admin/users/${data.admin.id}/status`).send({ isActive: false }).expect(409);
    await admin.patch(`/api/admin/users/${data.client.id}/status`).send({ isActive: false }).expect(200);
    await expect(agent('client@test.fr')).rejects.toThrow();
  });

  it('calcule les statistiques de ventes', async () => {
    const response = await admin.get('/api/admin/stats?period=30');
    expect(response.status).toBe(200);
    expect(response.body.kpis).toMatchObject({ revenueCents: 18000000, paidOrders: 1 });
  });
});
