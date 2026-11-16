import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoriesRoutes from './categories.routes.js';
import productsRoutes from './products.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);

export default router;
