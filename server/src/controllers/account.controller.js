import { changePassword, deleteAccount, exportData, updateProfile } from '../services/account.service.js';
import { toPublicUser } from '../services/auth.service.js';
import { AUTH_COOKIE, baseCookieOptions } from '../utils/cookies.js';

export async function patchProfile(req, res) {
  const user = await updateProfile(req.user, req.validated.body);
  res.json({ user: toPublicUser(user) });
}

export async function patchPassword(req, res) {
  await changePassword(req.user, req.validated.body);
  res.status(204).end();
}

export async function getExport(req, res) {
  const data = await exportData(req.user);
  // En-tête qui demande au navigateur de télécharger un fichier plutôt que de l'afficher
  res.attachment('mes-donnees-orbea.json').json(data);
}

export async function deleteMyAccount(req, res) {
  await deleteAccount(req.user, req.validated.body);
  res.clearCookie(AUTH_COOKIE, baseCookieOptions).status(204).end();
}
