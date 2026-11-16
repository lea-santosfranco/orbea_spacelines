import { Router } from 'express';
import healthRoutes from './health.routes.js';
import accountRoutes from './account.routes.js';
import authRoutes from './auth.routes.js';
import cartRoutes from './cart.routes.js';
import categoriesRoutes from './categories.routes.js';
import favoritesRoutes from './favorites.routes.js';
import ordersRoutes from './orders.routes.js';
import productsRoutes from './products.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/account', accountRoutes);
router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.use('/categories', categoriesRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/orders', ordersRoutes);
router.use('/products', productsRoutes);

export default router;
