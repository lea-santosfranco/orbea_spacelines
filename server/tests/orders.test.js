import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Stripe est remplacé par une simulation : les tests ne dépendent pas d'un service externe
const sessions = new Map();
const refunds = [];
vi.mock('../src/config/stripe.js', async () => {
  const { default: Stripe } = await import('stripe');
  return {
    stripe: {
      checkout: {
        sessions: {
          create: async (params) => {
            const id = `cs_test_${sessions.size + 1}`;
            const amount = params.line_items.reduce(
              (sum, line) => sum + line.price_data.unit_amount * line.quantity,
              0,
            );
            sessions.set(id, {
              id,
              status: 'open',
              payment_status: 'unpaid',
              metadata: params.metadata,
              payment_intent: `pi_${id}`,
              amount,
            });
            return { id, url: `https://checkout.stripe.test/${id}` };
          },
          retrieve: async (id) => sessions.get(id),
        },
      },
      refunds: { create: async ({ payment_intent: intent }) => refunds.push(intent) },
      webhooks: new Stripe('sk_test_factice').webhooks,
    },
  };
});

const { agent, app, prisma, resetDatabase, seedTestData } = await import('./helpers.js');
const { stripe } = await import('../src/config/stripe.js');

const shipping = { name: 'Cléo Client', address: '1 rue des Étoiles', postalCode: '33000', city: 'Bordeaux' };
const stockOf = async (id) => (await prisma.variant.findUnique({ where: { id } })).stock;
const pay = (id) => Object.assign(sessions.get(id), { status: 'complete', payment_status: 'paid' });

function sendWebhook(session) {
  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: session } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' });
  return request(app)
    .post('/api/webhooks/stripe')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', signature)
    .send(payload);
}

let data;
let client;
beforeAll(async () => {
  await resetDatabase();
  data = await seedTestData();
  client = await agent('client@test.fr');
});
beforeEach(async () => {
  await prisma.cartItem.deleteMany();
});

describe('Paiement', () => {
  it('exige d’être connecté', async () => {
    await request(app).post('/api/orders/checkout').send({ cgvAccepted: true }).expect(401);
  });

  it('crée une commande « en attente » avec les prix copiés, et une session Stripe au bon montant', async () => {
    await client.post('/api/cart/items').send({ variantId: data.trip.variants[0].id, quantity: 2 });
    await client.post('/api/cart/items').send({ variantId: data.goodie.variants[0].id, quantity: 1 });

    await client.post('/api/orders/checkout').send({ cgvAccepted: true }).expect(400); // adresse manquante (goodie)

    const response = await client.post('/api/orders/checkout').send({ cgvAccepted: true, shipping });
    expect(response.status).toBe(201);

    const order = await prisma.order.findUnique({ where: { id: response.body.orderId }, include: { items: true } });
    expect(order.status).toBe('PENDING_PAYMENT');
    expect(order.totalCents).toBe(2 * 18000000 + 2900);
    expect(sessions.get(order.stripeSessionId).amount).toBe(order.totalCents);
    expect(order.items.map((item) => item.productName)).toEqual(['Survol lunaire', 'T-shirt Orbéa']);
  });

  it('valide le paiement une seule fois : stock décrémenté, panier vidé, webhook rejoué sans effet', async () => {
    const order = await prisma.order.findFirst({ orderBy: { id: 'desc' } });
    pay(order.stripeSessionId);

    const response = await client.get(`/api/orders/${order.id}`);
    expect(response.body.status).toBe('PAID');
    expect(await stockOf(data.trip.variants[0].id)).toBe(1);

    await sendWebhook(sessions.get(order.stripeSessionId)).expect(200);
    await sendWebhook(sessions.get(order.stripeSessionId)).expect(200);
    expect(await stockOf(data.trip.variants[0].id)).toBe(1);
    expect((await client.get('/api/cart')).body.itemCount).toBe(0);
  });

  it('refuse un webhook mal signé', async () => {
    await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 't=1,v1=faux')
      .send('{}')
      .expect(400);
  });

  it('annule et rembourse si le stock a disparu entre-temps', async () => {
    await client.post('/api/cart/items').send({ variantId: data.goodie.variants[1].id, quantity: 1 });
    const { body } = await client.post('/api/orders/checkout').send({ cgvAccepted: true, shipping });
    await prisma.variant.update({ where: { id: data.goodie.variants[1].id }, data: { stock: 0 } });

    const order = await prisma.order.findUnique({ where: { id: body.orderId } });
    pay(order.stripeSessionId);
    const response = await client.get(`/api/orders/${order.id}`);

    expect(response.body.status).toBe('CANCELLED');
    expect(refunds).toContain(sessions.get(order.stripeSessionId).payment_intent);
    expect(await stockOf(data.goodie.variants[1].id)).toBe(0); // jamais négatif
  });

  it('cache les commandes des autres clients (404)', async () => {
    const order = await prisma.order.findFirst();
    const admin = await agent('admin@test.fr');
    await admin.get(`/api/orders/${order.id}`).expect(404);
  });

  it('n’affiche dans l’historique que les commandes payées', async () => {
    const response = await client.get('/api/orders');
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].status).toBe('PAID');
  });
});
