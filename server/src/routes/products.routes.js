import { Router } from 'express';
import { getProduct, getProducts } from '../controllers/products.controller.js';
import { validate } from '../middlewares/validate.js';
import { listProductsQuery, productSlugParams } from '../validators/products.validator.js';

const router = Router();

router.get('/', validate({ query: listProductsQuery }), getProducts);
router.get('/:slug', validate({ params: productSlugParams }), getProduct);

export default router;
