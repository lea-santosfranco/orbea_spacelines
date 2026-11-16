import { z } from 'zod';

export const email = z.string().trim().toLowerCase().pipe(z.email('Adresse e-mail invalide').max(255));

// Recommandation CNIL : au moins 12 caractères mêlant majuscules, minuscules, chiffres et caractères spéciaux
export const strongPassword = z
  .string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
  .max(128, 'Le mot de passe ne doit pas dépasser 128 caractères')
  .regex(/[a-z]/, 'Le mot de passe doit contenir une minuscule')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir une majuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir un chiffre')
  .regex(/[^a-zA-Z0-9]/, 'Le mot de passe doit contenir un caractère spécial');

export const name = (label) =>
  z.string().trim().min(1, `${label} est obligatoire`).max(100, `${label} est trop long`);

export const registerBody = z.object({
  firstName: name('Le prénom'),
  lastName: name('Le nom'),
  email,
  password: strongPassword,
  consent: z.literal(true, { error: 'Vous devez accepter la politique de confidentialité' }),
});

// À la connexion, on ne revérifie pas la robustesse : seulement la présence des champs
export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Le mot de passe est obligatoire').max(128),
});
