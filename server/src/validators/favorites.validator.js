import { z } from 'zod';

export const favoriteBody = z.object({
  productId: z.coerce.number().int().positive(),
});

export const favoriteParams = z.object({
  productId: z.coerce.number().int().positive(),
});
