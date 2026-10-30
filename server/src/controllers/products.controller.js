import { listProducts } from '../services/products.service.js';

// Express 5 transmet automatiquement les erreurs des fonctions async au gestionnaire d'erreurs
export async function getProducts(req, res) {
  const result = await listProducts(req.validated.query);
  res.json(result);
}