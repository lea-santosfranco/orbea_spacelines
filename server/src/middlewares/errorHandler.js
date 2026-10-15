import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const message =
    status === 500 && config.nodeEnv === 'production'
      ? 'Erreur interne du serveur'
      : err.message;

  res.status(status).json({ error: message });
}