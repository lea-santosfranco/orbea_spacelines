import { config } from '../config/env.js';

export const AUTH_COOKIE = 'orbea_token';
export const CART_COOKIE = 'orbea_cart';

// Cookies httpOnly : inaccessibles au JavaScript du navigateur, donc protégés contre le vol par une faille XSS
export const baseCookieOptions = {
  httpOnly: true,
  secure: config.isProduction, // HTTPS obligatoire en production
  sameSite: 'lax', // Non envoyés par les requêtes venant d'autres sites (protection CSRF)
  path: '/',
};

export const DAY_MS = 24 * 60 * 60 * 1000;
