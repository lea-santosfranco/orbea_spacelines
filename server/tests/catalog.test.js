import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app, prisma, resetDatabase, seedTestData } from './helpers.js';

let data;
beforeAll(async () => {
  await resetDatabase();
  data = await seedTestData();
});

describe('Catalogue', () => {
  it('liste les voyages avec le prix minimum et la disponibilité', async () => {
    const response = await request(app).get('/api/products?type=TRIP');
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0]).toMatchObject({ minPriceCents: 18000000, isAvailable: true, hasPriceRange: true });
  });

  it('cherche dans le nom et la description, sans tenir compte de la casse', async () => {
    const response = await request(app).get('/api/products?q=COTON');
    expect(response.body.items.map((p) => p.slug)).toEqual(['t-shirt-orbea']);
  });

  it('refuse un paramètre invalide (400) au lieu de le transmettre à la base', async () => {
    await request(app).get('/api/products?category=../../etc').expect(400);
    await request(app).get('/api/products?limit=5000').expect(400);
  });

  it('renvoie 404 pour un produit inconnu ou archivé', async () => {
    await request(app).get('/api/products/inconnu').expect(404);
    await prisma.product.update({ where: { id: data.goodie.id }, data: { isArchived: true } });
    await request(app).get('/api/products/t-shirt-orbea').expect(404);
    await prisma.product.update({ where: { id: data.goodie.id }, data: { isArchived: false } });
  });
});
