import { createToken, login, register, toPublicUser } from '../services/auth.service.js';
import { mergeVisitorCart } from '../services/cart.service.js';
import { AUTH_COOKIE, baseCookieOptions, CART_COOKIE, DAY_MS } from '../utils/cookies.js';

// Ouvre la session : cookie de connexion, et rattachement du panier visiteur au compte
async function sendSession(req, res, user, status) {
  await mergeVisitorCart(req.cookies?.[CART_COOKIE], user.id);

  res
    .clearCookie(CART_COOKIE, baseCookieOptions)
    .cookie(AUTH_COOKIE, createToken(user), { ...baseCookieOptions, maxAge: 7 * DAY_MS })
    .status(status)
    .json({ user: toPublicUser(user) });
}

export async function postRegister(req, res) {
  const user = await register(req.validated.body);
  await sendSession(req, res, user, 201);
}

export async function postLogin(req, res) {
  const user = await login(req.validated.body);
  await sendSession(req, res, user, 200);
}

export function postLogout(req, res) {
  res.clearCookie(AUTH_COOKIE, baseCookieOptions).status(204).end();
}

export function getMe(req, res) {
  res.json({ user: toPublicUser(req.user) });
}
