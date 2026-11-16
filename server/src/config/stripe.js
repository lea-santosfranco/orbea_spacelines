import Stripe from 'stripe';
import { config } from './env.js';

// Client Stripe partagé par toute l'API (null si la clé n'est pas configurée)
export const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;
