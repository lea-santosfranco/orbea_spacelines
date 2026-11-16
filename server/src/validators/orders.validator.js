import { z } from 'zod';

const text = (label, max) => z.string().trim().min(1, `${label} est obligatoire`).max(max, `${label} est trop long`);

export const shippingSchema = z.object({
  name: text('Le nom du destinataire', 200),
  address: text("L'adresse", 255),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Code postal invalide (5 chiffres)'),
  city: text('La ville', 100),
});

export const checkoutBody = z.object({
  cgvAccepted: z.literal(true, { error: 'Vous devez accepter les conditions générales de vente' }),
  // Obligatoire seulement si la commande contient des goodies (vérifié dans le service)
  shipping: shippingSchema.optional(),
});

export const orderIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
