import { Router } from 'express';
import { getOrder, postCheckout } from '../controllers/orders.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { checkoutBody, orderIdParams } from '../validators/orders.validator.js';

const router = Router();

// Toutes les routes de commande sont réservées aux clients connectés
router.use(requireAuth);

router.post('/checkout', validate({ body: checkoutBody }), postCheckout);
router.get('/:id', validate({ params: orderIdParams }), getOrder);

export default router;
