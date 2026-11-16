import { Router } from 'express';
import { deleteFavorite, getFavorites, postFavorite } from '../controllers/favorites.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { favoriteBody, favoriteParams } from '../validators/favorites.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFavorites);
router.post('/', validate({ body: favoriteBody }), postFavorite);
router.delete('/:productId', validate({ params: favoriteParams }), deleteFavorite);

export default router;
