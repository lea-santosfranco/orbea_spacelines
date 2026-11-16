import { z } from 'zod';

const id = z.coerce.number().int().positive();

export const productIdParams = z.object({ id });
export const imageParams = z.object({ id, imageId: id });

export const listAdminProductsQuery = z.object({
  type: z.enum(['TRIP', 'GOODIE']).optional(),
  archived: z.stringbool().default(false),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const variantSchema = z.object({
  id: id.optional(), // présent pour une variante existante, absent pour une nouvelle
  departureDate: z.iso.date('Date invalide (AAAA-MM-JJ)').nullable().optional(),
  travelClass: z.enum(['ECONOMY', 'BUSINESS', 'FIRST']).nullable().optional(),
  size: z.string().trim().max(20).nullable().optional(),
  priceCents: z.coerce.number().int('Prix invalide').min(0, 'Le prix ne peut pas être négatif').max(99_999_999),
  stock: z.coerce.number().int('Stock invalide').min(0, 'Le stock ne peut pas être négatif').max(100_000),
  isActive: z.boolean().default(true),
});

const productFields = {
  categoryId: id,
  name: z.string().trim().min(2, 'Le nom est obligatoire').max(150),
  description: z.string().trim().min(10, 'La description doit faire au moins 10 caractères').max(5000),
  durationDays: z.coerce.number().int().min(1).max(1000).nullable().optional(),
  variants: z.array(variantSchema).min(1, 'Ajoutez au moins une variante').max(100),
};

// Règles propres à chaque type : un voyage a une durée et des départs (date + classe), un goodie des tailles
function checkVariantsMatchType(data, ctx) {
  const seen = new Set();
  data.variants.forEach((variant, index) => {
    if (data.type === 'TRIP') {
      if (!variant.departureDate || !variant.travelClass) {
        ctx.addIssue({
          code: 'custom',
          path: ['variants', index],
          message: 'Chaque départ doit avoir une date et une classe',
        });
      }
    } else if (!variant.size) {
      ctx.addIssue({
        code: 'custom',
        path: ['variants', index],
        message: 'Chaque article doit avoir une taille (ou « Unique »)',
      });
    }
    const key = data.type === 'TRIP' ? `${variant.departureDate}|${variant.travelClass}` : variant.size;
    if (seen.has(key)) {
      ctx.addIssue({ code: 'custom', path: ['variants', index], message: 'Cette variante est en double' });
    }
    seen.add(key);
  });
  if (data.type === 'TRIP' && !data.durationDays) {
    ctx.addIssue({ code: 'custom', path: ['durationDays'], message: 'La durée est obligatoire pour un voyage' });
  }
}

export const createProductBody = z
  .object({ type: z.enum(['TRIP', 'GOODIE']), ...productFields })
  .superRefine(checkVariantsMatchType);

// Le type n'est pas modifiable après la création : il est relu en base par le service
export const updateProductBody = z.object(productFields);
export { checkVariantsMatchType };

export const archiveBody = z.object({ isArchived: z.boolean() });

export const imageBody = z.object({
  altText: z
    .string({ error: 'Le texte alternatif est obligatoire (accessibilité)' })
    .trim()
    .min(3, 'Le texte alternatif est obligatoire (accessibilité)')
    .max(200),
});
