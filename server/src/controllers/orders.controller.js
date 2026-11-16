import { config } from '../config/env.js';
import { stripe } from '../config/stripe.js';
import { createCheckout, getOrderForUser, handleStripeEvent } from '../services/orders.service.js';
import { HttpError } from '../utils/httpError.js';

export async function postCheckout(req, res) {
  const result = await createCheckout(req.user, req.validated.body);
  res.status(201).json(result);
}

export async function getOrder(req, res) {
  res.json(await getOrderForUser(req.user, req.validated.params.id));
}

// Webhook Stripe : la signature prouve que la requête vient bien de Stripe et n'a pas été modifiée
export async function postStripeWebhook(req, res) {
  if (!stripe || !config.stripeWebhookSecret) {
    throw new HttpError(503, 'Webhook Stripe non configuré');
  }

  let event;
  try {
    // req.body est ici le corps brut (Buffer) : la signature est calculée sur les octets exacts reçus
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.stripeWebhookSecret);
  } catch {
    throw new HttpError(400, 'Signature Stripe invalide');
  }

  await handleStripeEvent(event);
  res.json({ received: true });
}
