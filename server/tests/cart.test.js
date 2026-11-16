import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { agent, app, PASSWORD, resetDatabase, seedTestData } from './helpers.js';

let data;
beforeAll(async () => {
  await resetDatabase();
  data = await seedTestData();
});

describe('Panier', () => {
  it('permet à un visiteur d’ajouter un article (cookie de panier)', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .send({ variantId: data.goodie.variants[0].id, quantity: 2 });
    expect(response.status).toBe(201);
    expect(response.headers['set-cookie'][0]).toMatch(/orbea_cart=/);
    expect(response.body).toMatchObject({ itemCount: 2, subtotalCents: 5800 });
  });

  it('refuse un départ complet et une quantité supérieure au stock (409)', async () => {
    await request(app).post('/api/cart/items').send({ variantId: data.trip.variants[1].id }).expect(409);
    await request(app).post('/api/cart/items').send({ variantId: data.trip.variants[0].id, quantity: 4 }).expect(409);
  });

  it('garde les paniers des visiteurs séparés', async () => {
    const response = await request(app).get('/api/cart');
    expect(response.body.itemCount).toBe(0);
  });

  it('fusionne le panier visiteur avec celui du compte à la connexion', async () => {
    const client = await agent('client@test.fr');
    await client.post('/api/cart/items').send({ variantId: data.goodie.variants[0].id, quantity: 1 }).expect(201);
    await client.post('/api/auth/logout');

    const visitor = request.agent(app);
    await visitor.post('/api/cart/items').send({ variantId: data.goodie.variants[0].id, quantity: 2 }).expect(201);
    await visitor.post('/api/cart/items').send({ variantId: data.trip.variants[0].id, quantity: 1 }).expect(201);
    await visitor.post('/api/auth/login').send({ email: 'client@test.fr', password: PASSWORD }).expect(200);

    const cart = await visitor.get('/api/cart');
    expect(cart.body.items.map((item) => [item.variantId, item.quantity])).toEqual([
      [data.goodie.variants[0].id, 3],
      [data.trip.variants[0].id, 1],
    ]);
  });
});
