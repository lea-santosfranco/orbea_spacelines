const TRAVEL_CLASS_LABELS = { ECONOMY: 'Économie', BUSINESS: 'Affaires', FIRST: 'Première' };

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC', // Les dates de départ sont stockées sans heure : on les lit en UTC pour éviter tout décalage
});

// Libellé lisible d'une variante, affiché dans le panier et recopié dans les commandes
// Ex. « Départ le 14 mars 2027 · Classe Affaires » ou « Taille M »
export function variantLabel(variant) {
  if (variant.departureDate) {
    return `Départ le ${dateFormatter.format(variant.departureDate)} · Classe ${TRAVEL_CLASS_LABELS[variant.travelClass]}`;
  }
  if (variant.size && variant.size !== 'Unique') {
    return `Taille ${variant.size}`;
  }
  return 'Taille unique';
}
