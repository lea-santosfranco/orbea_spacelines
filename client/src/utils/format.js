// Les montants sont stockés en centimes : 4500000 → « 45 000 € »
export function formatPrice(cents) {
  const hasCents = cents % 100 !== 0;

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

export function formatDuration(days) {
  return days === 1 ? '1 jour' : `${days} jours`;
}
// « 2027-03-14 » → « 14 mars 2027 » (la date est lue telle quelle, sans fuseau horaire)
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

export const TRAVEL_CLASS_LABELS = {
  ECONOMY: 'Économie',
  BUSINESS: 'Affaires',
  FIRST: 'Première',
};

export function formatSeats(stock) {
  return stock === 1 ? '1 place restante' : `${stock} places restantes`;
}
