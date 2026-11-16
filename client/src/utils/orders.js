// Libellés et couleurs des statuts de commande
export const ORDER_STATUS = {
  PENDING_PAYMENT: { label: 'En attente de paiement', className: 'border-vigilance/50 text-vigilance' },
  PAID: { label: 'Payée', className: 'border-succes/50 text-succes' },
  SHIPPED: { label: 'Expédiée', className: 'border-ciel/50 text-ciel' },
  COMPLETED: { label: 'Terminée', className: 'border-contour text-neige' },
  CANCELLED: { label: 'Annulée', className: 'border-erreur/50 text-erreur' },
};

export function formatDateTime(isoString) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(isoString),
  );
}
