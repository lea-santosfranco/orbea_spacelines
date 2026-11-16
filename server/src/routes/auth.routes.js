import { Router } from 'express';
import { getMe, postLogin, postLogout, postRegister } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { loginBody, registerBody } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerLimiter, validate({ body: registerBody }), postRegister);
router.post('/login', loginLimiter, validate({ body: loginBody }), postLogin);
router.post('/logout', postLogout);
router.get('/me', requireAuth, getMe);

export default router;
