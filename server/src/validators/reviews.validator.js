import { z } from 'zod';

export const reviewBody = z.object({
  rating: z.coerce
    .number({ error: 'Choisissez une note' })
    .int('Note invalide')
    .min(1, 'La note va de 1 à 5')
    .max(5, 'La note va de 1 à 5'),
  comment: z
    .string({ error: 'Le commentaire est obligatoire' })
    .trim()
    .min(10, 'Le commentaire doit faire au moins 10 caractères')
    .max(1000, 'Le commentaire ne doit pas dépasser 1 000 caractères'),
});

export const reviewIdParams = z.object({ id: z.coerce.number().int().positive() });
