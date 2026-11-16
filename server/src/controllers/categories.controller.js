import { listCategories } from '../services/categories.service.js';

export async function getCategories(req, res) {
  const categories = await listCategories(req.validated.query);
  res.json(categories);
}
