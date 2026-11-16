import { z } from 'zod';

export const MAX_QUANTITY_PER_LINE = 10;

const quantity = z.coerce
  .number()
  .int()
  .min(1, 'Quantité minimale : 1')
  .max(MAX_QUANTITY_PER_LINE, `Quantité maximale : ${MAX_QUANTITY_PER_LINE}`);

export const addCartItemBody = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: quantity.default(1),
});

export const updateCartItemBody = z.object({
  quantity,
});

export const cartItemParams = z.object({
  variantId: z.coerce.number().int().positive(),
});
