import * as service from '../../services/admin/orders.service.js';

export async function getOrders(req, res) {
  res.json(await service.listAdminOrders(req.validated.query));
}

export async function getOrder(req, res) {
  res.json(await service.getAdminOrder(req.validated.params.id));
}

export async function patchStatus(req, res) {
  res.json(await service.updateOrderStatus(req.validated.params.id, req.validated.body.status));
}
