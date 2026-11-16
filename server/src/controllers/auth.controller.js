import { config } from '../config/env.js';
import { AUTH_COOKIE } from '../middlewares/auth.js';
import { createToken, login, register, toPublicUser } from '../services/auth.service.js';

// Cookie httpOnly : inaccessible au JavaScript du navigateur, donc protégé contre le vol par une faille XSS
const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction, // HTTPS obligatoire en production
  sameSite: 'lax', // Le cookie n'est pas envoyé par les requêtes venant d'autres sites (protection CSRF)
  path: '/',
};

function sendSession(res, user, status) {
  res
    .cookie(AUTH_COOKIE, createToken(user), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .status(status)
    .json({ user: toPublicUser(user) });
}

export async function postRegister(req, res) {
  const user = await register(req.validated.body);
  sendSession(res, user, 201);
}

export async function postLogin(req, res) {
  const user = await login(req.validated.body);
  sendSession(res, user, 200);
}

export function postLogout(req, res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions).status(204).end();
}

export function getMe(req, res) {
  res.json({ user: toPublicUser(req.user) });
}
