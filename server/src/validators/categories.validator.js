import { z } from 'zod';

export const listCategoriesQuery = z.object({
  type: z.enum(['TRIP', 'GOODIE']).optional(),
});
