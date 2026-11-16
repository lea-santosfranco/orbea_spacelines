// « Séjour à la station Horizon » → « sejour-a-la-station-horizon »
export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

// Ajoute -2, -3… si le slug est déjà pris (exists est une fonction asynchrone qui interroge la base)
export async function uniqueSlug(text, exists) {
  const base = slugify(text) || 'produit';
  let slug = base;
  for (let i = 2; await exists(slug); i += 1) slug = `${base}-${i}`;
  return slug;
}
