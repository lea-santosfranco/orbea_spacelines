import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';

// En production, le secret JWT est obligatoire. En développement, une valeur par défaut évite de bloquer le démarrage.
if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET doit être défini en production');
}

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET absent : secret de développement utilisé (ne jamais faire ça en production)');
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 3000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-orbea-a-ne-pas-utiliser-en-production',
  jwtExpiresIn: '7d',
  // Paiement : clé secrète Stripe (mode test) et secret de signature des webhooks (facultatif en local)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
};
