import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

// Limite les tentatives de connexion : 5 échecs par adresse IP et par e-mail sur 15 minutes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true, // Seuls les échecs comptent
  // ipKeyGenerator regroupe les adresses IPv6 d'un même réseau, sinon le blocage serait facile à contourner
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${String(req.body?.email ?? '').toLowerCase()}`,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

// Limite les créations de compte : 10 par heure et par adresse IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de créations de compte. Réessayez plus tard.' },
});

// Limite générale de l'API : protège contre l'abus et les scripts (1000 requêtes par IP et par 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
});
