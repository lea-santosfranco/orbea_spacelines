import { z } from 'zod';

export const PRODUCT_SORTS = ['default', 'price_asc', 'price_desc', 'date'];

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Format invalide')
  .max(100);

export const listProductsQuery = z
  .object({
    type: z.enum(['TRIP', 'GOODIE']).optional(),
    q: z.string().trim().max(100).optional(),
    category: slug.optional(),
    sort: z.enum(PRODUCT_SORTS).default('default'),
    // « true » / « false » dans l'URL, converti en vrai booléen
    available: z.stringbool().default(false),
    // Fourchette de prix en euros (entiers)
    minPrice: z.coerce.number().int().min(0).max(1_000_000).optional(),
    maxPrice: z.coerce.number().int().min(0).max(1_000_000).optional(),
    travelClass: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).optional(),
    departureFrom: z.iso.date('Date invalide').optional(),
    departureTo: z.iso.date('Date invalide').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(24).default(12),
  })
  .refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    message: 'Le prix minimum doit être inférieur au prix maximum',
    path: ['minPrice'],
  })
  .refine((query) => !query.departureFrom || !query.departureTo || query.departureFrom <= query.departureTo, {
    message: 'La date de début doit précéder la date de fin',
    path: ['departureFrom'],
  });

export const productSlugParams = z.object({
  slug,
});
