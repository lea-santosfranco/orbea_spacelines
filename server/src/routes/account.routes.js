import { Router } from 'express';
import { deleteMyAccount, getExport, patchPassword, patchProfile } from '../controllers/account.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { changePasswordBody, deleteAccountBody, updateProfileBody } from '../validators/account.validator.js';

const router = Router();

router.use(requireAuth);

router.patch('/profile', validate({ body: updateProfileBody }), patchProfile);
router.patch('/password', validate({ body: changePasswordBody }), patchPassword);
router.get('/export', getExport);
router.delete('/', validate({ body: deleteAccountBody }), deleteMyAccount);

export default router;
