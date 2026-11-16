import { z } from 'zod';

export const categoryIdParams = z.object({ id: z.coerce.number().int().positive() });

export const createCategoryBody = z.object({
  name: z.string().trim().min(2, 'Le nom est obligatoire').max(100),
  productType: z.enum(['TRIP', 'GOODIE']),
});

export const updateCategoryBody = z.object({
  name: z.string().trim().min(2, 'Le nom est obligatoire').max(100),
});
