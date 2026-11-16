import { Router } from 'express';
import { deleteCartItem, getCart, patchCartItem, postCartItem } from '../controllers/cart.controller.js';
import { optionalAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { addCartItemBody, cartItemParams, updateCartItemBody } from '../validators/cart.validator.js';

const router = Router();

// Le panier est accessible aux visiteurs comme aux clients connectés
router.use(optionalAuth);

router.get('/', getCart);
router.post('/items', validate({ body: addCartItemBody }), postCartItem);
router.patch('/items/:variantId', validate({ params: cartItemParams, body: updateCartItemBody }), patchCartItem);
router.delete('/items/:variantId', validate({ params: cartItemParams }), deleteCartItem);

export default router;
