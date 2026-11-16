import { z } from 'zod';
import { email, name, strongPassword } from './auth.validator.js';

// Champ d'adresse facultatif : une chaîne vide est enregistrée comme « non renseigné » (null)
const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .optional();

export const updateProfileBody = z.object({
  firstName: name('Le prénom'),
  lastName: name('Le nom'),
  email,
  address: optionalText(255),
  postalCode: z
    .string()
    .trim()
    .regex(/^(\d{5})?$/, 'Code postal invalide (5 chiffres)')
    .transform((value) => value || null)
    .nullable()
    .optional(),
  city: optionalText(100),
});

export const changePasswordBody = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est obligatoire').max(128),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les deux mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const deleteAccountBody = z.object({
  password: z.string().min(1, 'Le mot de passe est obligatoire').max(128),
});
