import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { config } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

// Empreinte factice : vérifiée quand l'e-mail est inconnu, pour que la réponse prenne le même temps
// (sinon, un attaquant pourrait deviner quels e-mails ont un compte en mesurant le temps de réponse)
const dummyHashPromise = argon2.hash('mot-de-passe-factice-pour-egaliser-le-temps');

// Seules ces informations sortent de l'API : jamais le hash du mot de passe
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export function createToken(user) {
  // Le jeton ne contient que l'identifiant et le rôle, rien de sensible
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function register({ firstName, lastName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Cette adresse e-mail est déjà utilisée');
  }

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash: await argon2.hash(password),
      consentAt: new Date(), // Preuve du consentement (RGPD)
    },
  });

  return user;
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordOk = await argon2.verify(user?.passwordHash ?? (await dummyHashPromise), password);

  // Même message dans tous les cas : on ne révèle pas si l'e-mail existe
  if (!user || !passwordOk || !user.isActive || user.anonymizedAt) {
    throw new HttpError(401, 'E-mail ou mot de passe incorrect');
  }

  return user;
}

// Retrouve l'utilisateur d'un jeton, en vérifiant qu'il a toujours le droit d'être connecté
export async function getUserFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return null; // Jeton expiré, modifié ou mal formé
  }

  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user || !user.isActive || user.anonymizedAt) return null;

  return user;
}
