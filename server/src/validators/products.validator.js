import { z } from 'zod';

export const PRODUCT_SORTS = ['default', 'price_asc', 'price_desc'];

export const listProductsQuery = z.object({
  type: z.enum(['TRIP', 'GOODIE']).optional(),
  q: z.string().trim().max(100).optional(),
  category: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Catégorie invalide')
    .max(100)
    .optional(),
  sort: z.enum(PRODUCT_SORTS).default('default'),
  // « true » / « false » dans l'URL, converti en vrai booléen
  available: z.stringbool().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});
