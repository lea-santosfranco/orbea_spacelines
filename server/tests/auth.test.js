import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { agent, app, PASSWORD, resetDatabase, seedTestData } from './helpers.js';

beforeAll(async () => {
  await resetDatabase();
  await seedTestData();
});

describe('Inscription', () => {
  const valid = {
    firstName: 'Léa',
    lastName: 'Test',
    email: 'Nouvelle@Test.fr',
    password: 'Tres-Solide-2026!',
    consent: true,
  };

  it('refuse un mot de passe trop faible', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, password: 'faible' });
    expect(response.status).toBe(400);
    expect(response.body.details.map((d) => d.field)).toContain('password');
  });

  it('exige le consentement', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, consent: false });
    expect(response.status).toBe(400);
  });

  it('crée le compte, normalise l’e-mail et ouvre la session (cookie httpOnly)', async () => {
    const response = await request(app).post('/api/auth/register').send(valid);
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('nouvelle@test.fr');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const sessionCookie = response.headers['set-cookie'].find((cookie) => cookie.startsWith('orbea_token='));
    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
  });

  it('refuse un e-mail déjà utilisé', async () => {
    const response = await request(app).post('/api/auth/register').send(valid);
    expect(response.status).toBe(409);
  });
});

describe('Connexion', () => {
  it('connecte avec les bons identifiants', async () => {
    const session = await agent('client@test.fr');
    const me = await session.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.role).toBe('CLIENT');
  });

  it('renvoie le même message pour un e-mail inconnu et un mauvais mot de passe', async () => {
    const unknown = await request(app).post('/api/auth/login').send({ email: 'inconnu@test.fr', password: PASSWORD });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'admin@test.fr', password: 'mauvais' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error).toBe(wrong.body.error);
  });

  it('refuse un jeton falsifié ou non signé', async () => {
    const forged = jwt.sign({ sub: '1', role: 'ADMIN' }, 'mauvais-secret');
    const unsigned = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from('{"sub":"1","role":"ADMIN"}').toString('base64url')}.`;
    for (const token of [forged, unsigned]) {
      const response = await request(app).get('/api/auth/me').set('Cookie', `orbea_token=${token}`);
      expect(response.status).toBe(401);
    }
  });

  it('bloque après 5 échecs (anti force brute)', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'client@test.fr', password: 'faux' });
    for (let i = 0; i < 5; i += 1) expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });

  it('déconnecte en supprimant le cookie', async () => {
    const session = await agent('admin@test.fr');
    await session.post('/api/auth/logout').expect(204);
    await session.get('/api/auth/me').expect(401);
  });
});
