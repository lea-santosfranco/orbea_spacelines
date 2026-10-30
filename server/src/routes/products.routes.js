import { Router } from 'express';
import { getProducts } from '../controllers/products.controller.js';
import { validate } from '../middlewares/validate.js';
import { listProductsQuery } from '../validators/products.validator.js';

const router = Router();

router.get('/', validate({ query: listProductsQuery }), getProducts);

export default router;