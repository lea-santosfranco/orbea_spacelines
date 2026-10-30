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