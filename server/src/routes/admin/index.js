import { Router } from 'express';
import * as products from '../../controllers/admin/products.controller.js';
import * as categories from '../../controllers/admin/categories.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.js';
import { uploadProductImage } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import {
  archiveBody,
  createProductBody,
  imageParams,
  listAdminProductsQuery,
  productIdParams,
  updateProductBody,
} from '../../validators/admin/products.validator.js';
import {
  categoryIdParams,
  createCategoryBody,
  updateCategoryBody,
} from '../../validators/admin/categories.validator.js';

const router = Router();

// Toute l'administration : utilisateur connecté (401 sinon) ET rôle ADMIN (403 sinon), vérifiés côté serveur
router.use(requireAuth, requireRole('ADMIN'));

// Produits et variantes
router.get('/products', validate({ query: listAdminProductsQuery }), products.getProducts);
router.post('/products', validate({ body: createProductBody }), products.postProduct);
router.get('/products/:id', validate({ params: productIdParams }), products.getProduct);
router.put('/products/:id', validate({ params: productIdParams, body: updateProductBody }), products.putProduct);
router.patch('/products/:id/archive', validate({ params: productIdParams, body: archiveBody }), products.patchArchive);

// Images
router.post('/products/:id/images', validate({ params: productIdParams }), uploadProductImage, products.postImage);
router.delete('/products/:id/images/:imageId', validate({ params: imageParams }), products.deleteImage);
router.patch('/products/:id/images/:imageId/main', validate({ params: imageParams }), products.patchMainImage);

// Catégories
router.get('/categories', categories.getCategories);
router.post('/categories', validate({ body: createCategoryBody }), categories.postCategory);
router.put('/categories/:id', validate({ params: categoryIdParams, body: updateCategoryBody }), categories.putCategory);
router.delete('/categories/:id', validate({ params: categoryIdParams }), categories.deleteCategory);

export default router;
