import { z } from 'zod';

export const listAdminUsersQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUserParams = z.object({ id: z.coerce.number().int().positive() });

export const userStatusBody = z.object({ isActive: z.boolean() });
