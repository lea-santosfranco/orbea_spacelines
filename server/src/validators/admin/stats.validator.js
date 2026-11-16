import { z } from 'zod';

// Période en jours : 30 jours, 3 mois ou 1 an
export const statsQuery = z.object({
  period: z.coerce
    .number()
    .pipe(z.union([z.literal(30), z.literal(90), z.literal(365)]))
    .default(30),
});
