import { addItem, createCartToken, getCartView, removeItem, updateItem } from '../services/cart.service.js';
import { baseCookieOptions, CART_COOKIE, DAY_MS } from '../utils/cookies.js';

// Propriétaire du panier : le compte si l'utilisateur est connecté, sinon le jeton visiteur
function getOwner(req) {
  if (req.user) return { userId: req.user.id };
  return { token: req.cookies?.[CART_COOKIE] ?? null };
}

export async function getCart(req, res) {
  res.json(await getCartView(getOwner(req)));
}

export async function postCartItem(req, res) {
  const owner = getOwner(req);

  // Premier ajout d'un visiteur : on lui crée un jeton de panier, conservé 30 jours dans un cookie
  if (!req.user && !owner.token) {
    owner.token = createCartToken();
    res.cookie(CART_COOKIE, owner.token, { ...baseCookieOptions, maxAge: 30 * DAY_MS });
  }

  await addItem(owner, req.validated.body);
  res.status(201).json(await getCartView(owner));
}

export async function patchCartItem(req, res) {
  const owner = getOwner(req);
  await updateItem(owner, req.validated.params.variantId, req.validated.body.quantity);
  res.json(await getCartView(owner));
}

export async function deleteCartItem(req, res) {
  const owner = getOwner(req);
  await removeItem(owner, req.validated.params.variantId);
  res.json(await getCartView(owner));
}
