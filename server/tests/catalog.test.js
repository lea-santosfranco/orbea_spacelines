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

describe('Filtres et tri', () => {
  it('filtre par classe et par prix sur la même variante, et affiche le prix de la variante retenue', async () => {
    // La Première (450 000 €) existe mais est complète : elle reste trouvable sans « available »
    const first = await request(app).get('/api/products?type=TRIP&travelClass=FIRST&minPrice=400000');
    expect(first.body.total).toBe(1);
    expect(first.body.items[0].minPriceCents).toBe(45000000);

    // Aucune variante ne combine Économie ET prix ≥ 400 000 € : le produit est exclu
    const none = await request(app).get('/api/products?type=TRIP&travelClass=ECONOMY&minPrice=400000');
    expect(none.body.total).toBe(0);
  });

  it('filtre par période de départ et masque les complets', async () => {
    const inRange = await request(app).get('/api/products?type=TRIP&departureFrom=2030-05-01&departureTo=2030-05-31');
    expect(inRange.body.total).toBe(1);
    const outOfRange = await request(app).get('/api/products?type=TRIP&departureFrom=2031-01-01');
    expect(outOfRange.body.total).toBe(0);
    const available = await request(app).get('/api/products?type=TRIP&travelClass=FIRST&available=true');
    expect(available.body.total).toBe(0);
  });

  it('trie les voyages par prochain départ et refuse une fourchette incohérente', async () => {
    const sorted = await request(app).get('/api/products?type=TRIP&sort=date');
    expect(sorted.body.items[0].nextDepartureDate).toBe('2030-05-18');
    await request(app).get('/api/products?minPrice=10&maxPrice=5').expect(400);
    await request(app).get('/api/products?departureFrom=2030-13-01').expect(400);
  });
});
