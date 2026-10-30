import { z } from 'zod';

export const listProductsQuery = z.object({
  type: z.enum(['TRIP', 'GOODIE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});