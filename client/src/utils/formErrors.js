// Transforme les erreurs de validation de l'API en { champ: message } (premier message de chaque champ)
export function fieldErrors(error) {
  const errors = {};
  for (const detail of error.details ?? []) {
    if (!errors[detail.field]) errors[detail.field] = detail.message;
  }
  return errors;
}
