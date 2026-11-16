import { addFavorite, listFavorites, removeFavorite } from '../services/favorites.service.js';

export async function getFavorites(req, res) {
  res.json(await listFavorites(req.user));
}

export async function postFavorite(req, res) {
  await addFavorite(req.user, req.validated.body.productId);
  res.status(201).json(await listFavorites(req.user));
}

export async function deleteFavorite(req, res) {
  await removeFavorite(req.user, req.validated.params.productId);
  res.json(await listFavorites(req.user));
}
