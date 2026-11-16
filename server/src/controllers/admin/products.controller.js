import * as service from '../../services/admin/products.service.js';
import { imageBody } from '../../validators/admin/products.validator.js';
import { HttpError } from '../../utils/httpError.js';
import fs from 'node:fs/promises';

export async function getProducts(req, res) {
  res.json(await service.listAdminProducts(req.validated.query));
}

export async function getProduct(req, res) {
  res.json(await service.getAdminProduct(req.validated.params.id));
}

export async function postProduct(req, res) {
  res.status(201).json(await service.createProduct(req.validated.body));
}

export async function putProduct(req, res) {
  res.json(await service.updateProduct(req.validated.params.id, req.validated.body));
}

export async function patchArchive(req, res) {
  res.json(await service.setArchived(req.validated.params.id, req.validated.body.isArchived));
}

export async function postImage(req, res) {
  // Le texte alternatif arrive avec le fichier (formulaire multipart) : il est validé après l'envoi
  const result = imageBody.safeParse(req.body);
  if (!result.success) {
    await fs.rm(req.file.path, { force: true });
    throw new HttpError(400, result.error.issues[0].message);
  }
  res.status(201).json(await service.addImage(req.validated.params.id, req.file, result.data.altText));
}

export async function deleteImage(req, res) {
  res.json(await service.deleteImage(req.validated.params.id, req.validated.params.imageId));
}

export async function patchMainImage(req, res) {
  res.json(await service.setMainImage(req.validated.params.id, req.validated.params.imageId));
}
