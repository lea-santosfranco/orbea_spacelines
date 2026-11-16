import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { postStripeWebhook } from './controllers/orders.controller.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimit.js';

const app = express();

// Nécessaire derrière un proxy (hébergement) pour que la limitation par IP voie la vraie adresse du client
if (config.isProduction) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
// Le webhook Stripe a besoin du corps brut pour vérifier la signature : il est déclaré AVANT express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), postStripeWebhook);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Images envoyées par l'administration (lecture seule, sans liste des fichiers du dossier)
app.use('/uploads', express.static(path.resolve('uploads'), { index: false, dotfiles: 'deny', maxAge: '7d' }));

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
