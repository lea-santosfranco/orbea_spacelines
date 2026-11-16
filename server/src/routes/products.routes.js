import { Router } from 'express';
import { getProduct, getProducts } from '../controllers/products.controller.js';
import { deleteMine, getReviews, postReview } from '../controllers/reviews.controller.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { reviewBody } from '../validators/reviews.validator.js';
import { listProductsQuery, productSlugParams } from '../validators/products.validator.js';

const router = Router();

router.get('/', validate({ query: listProductsQuery }), getProducts);
router.get('/:slug', validate({ params: productSlugParams }), getProduct);

// Avis : lecture publique (le formulaire dépend du client connecté), écriture réservée aux clients
router.get('/:slug/reviews', optionalAuth, validate({ params: productSlugParams }), getReviews);
router.post('/:slug/reviews', requireAuth, validate({ params: productSlugParams, body: reviewBody }), postReview);
router.delete('/:slug/reviews/mine', requireAuth, validate({ params: productSlugParams }), deleteMine);

export default router;
