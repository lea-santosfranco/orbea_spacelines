import { z } from 'zod';

const STATUSES = ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

export const listAdminOrdersQuery = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminOrderParams = z.object({ id: z.coerce.number().int().positive() });

export const updateStatusBody = z.object({ status: z.enum(STATUSES) });
