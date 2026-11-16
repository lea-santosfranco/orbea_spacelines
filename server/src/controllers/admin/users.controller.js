import * as service from '../../services/admin/users.service.js';

export async function getUsers(req, res) {
  res.json(await service.listAdminUsers(req.validated.query));
}

export async function patchUserStatus(req, res) {
  res.json(await service.setUserActive(req.user, req.validated.params.id, req.validated.body.isActive));
}
