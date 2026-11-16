import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Seules les vraies erreurs serveur sont journalisées (pas les 404 ou 400 attendues)
  if (status >= 500) console.error(err);

  const message =
    status === 500 && config.nodeEnv === 'production'
      ? 'Erreur interne du serveur'
      : err.message;

  res.status(status).json({ error: message });
}
