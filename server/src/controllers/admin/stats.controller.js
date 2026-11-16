import { getDashboardStats } from '../../services/admin/stats.service.js';

export async function getStats(req, res) {
  res.json(await getDashboardStats(req.validated.query));
}
