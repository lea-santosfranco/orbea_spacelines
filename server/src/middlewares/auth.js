import { getUserFromToken } from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';
import { AUTH_COOKIE } from '../utils/cookies.js';

// Exige un utilisateur connecté : place l'utilisateur dans req.user, sinon 401
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  const user = token ? await getUserFromToken(token) : null;

  if (!user) {
    throw new HttpError(401, 'Authentification requise');
  }

  req.user = user;
  next();
}

// Exige un rôle précis (à placer après requireAuth) : 403 si le rôle ne correspond pas
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      throw new HttpError(403, 'Accès refusé');
    }
    next();
  };
}

// Connexion facultative : renseigne req.user si un jeton valide est présent, sans bloquer les visiteurs
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  req.user = token ? await getUserFromToken(token) : null;
  next();
}
