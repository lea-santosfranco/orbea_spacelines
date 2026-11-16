import * as service from '../../services/admin/categories.service.js';

export async function getCategories(req, res) {
  res.json(await service.listAdminCategories());
}

export async function postCategory(req, res) {
  res.status(201).json(await service.createCategory(req.validated.body));
}

export async function putCategory(req, res) {
  res.json(await service.updateCategory(req.validated.params.id, req.validated.body));
}

export async function deleteCategory(req, res) {
  await service.deleteCategory(req.validated.params.id);
  res.status(204).end();
}
