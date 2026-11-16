import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { agent, app, prisma, resetDatabase, seedTestData } from './helpers.js';

let data;
let client;
const review = { rating: 5, comment: 'Un voyage inoubliable, équipage aux petits soins.' };

beforeAll(async () => {
  await resetDatabase();
  data = await seedTestData();
  client = await agent('client@test.fr');
});

describe('Avis', () => {
  it('liste les avis publiquement, sans formulaire pour un visiteur', async () => {
    const response = await request(app).get('/api/products/survol-lunaire/reviews');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ count: 0, average: null, canReview: false });
  });

  it('refuse l’avis d’un client qui n’a pas acheté le produit (403)', async () => {
    const response = await client.post('/api/products/survol-lunaire/reviews').send(review);
    expect(response.status).toBe(403);
    expect((await client.get('/api/products/survol-lunaire/reviews')).body.canReview).toBe(false);
  });

  it('accepte l’avis après un achat payé, une seule fois par produit', async () => {
    await prisma.order.create({
      data: {
        userId: data.client.id,
        number: 'ORB-TEST-AVIS',
        status: 'COMPLETED',
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
    expect((await client.get('/api/products/survol-lunaire/reviews')).body.canReview).toBe(true);

    await client.post('/api/products/survol-lunaire/reviews').send({ rating: 6, comment: 'Trop court' }).expect(400);

    const created = await client.post('/api/products/survol-lunaire/reviews').send(review);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ count: 1, average: 5, canReview: false });
    expect(created.body.items[0]).toMatchObject({ author: 'Cléo C.', isMine: true });

    await client.post('/api/products/survol-lunaire/reviews').send(review).expect(409);
  });

  it('protège la note par une contrainte en base (1 à 5)', async () => {
    await expect(
      prisma.review.create({
        data: { userId: data.admin.id, productId: data.goodie.id, rating: 9, comment: 'Contrôle base' },
      }),
    ).rejects.toThrow();
  });

  it('permet au client de retirer son avis et à l’admin de modérer', async () => {
    const removed = await client.delete('/api/products/survol-lunaire/reviews/mine');
    expect(removed.body.count).toBe(0);

    const again = await client.post('/api/products/survol-lunaire/reviews').send(review);
    const admin = await agent('admin@test.fr');
    await client.delete(`/api/admin/reviews/${again.body.items[0].id}`).expect(403);
    await admin.delete(`/api/admin/reviews/${again.body.items[0].id}`).expect(204);
    expect((await request(app).get('/api/products/survol-lunaire/reviews')).body.count).toBe(0);
  });
});
