import { Router } from 'express';
import { getCategories } from '../controllers/categories.controller.js';
import { validate } from '../middlewares/validate.js';
import { listCategoriesQuery } from '../validators/categories.validator.js';

const router = Router();

router.get('/', validate({ query: listCategoriesQuery }), getCategories);

export default router;
