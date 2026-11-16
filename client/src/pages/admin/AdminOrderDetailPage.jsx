import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { primaryButton, secondaryButton, tableClass, tdClass, thClass } from '../../components/admin/adminStyles.js';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import { admin } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import { formatDateTime, ORDER_STATUS } from '../../utils/orders.js';

const ACTION_LABELS = {
  SHIPPED: 'Marquer comme expédiée',
  COMPLETED: 'Marquer comme terminée',
  CANCELLED: 'Annuler la commande',
};

function AdminOrderDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, order: null, error: '' });
  const [action, setAction] = useState({ pending: false, error: '', confirmCancel: false });

  useEffect(() => {
    const controller = new AbortController();
    admin
      .getOrder(id, { signal: controller.signal })
      .then((order) => setResult({ id, order, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ id, order: null, error: error.message });
      });
    return () => controller.abort();
  }, [id]);

  async function changeStatus(status) {
    setAction({ pending: true, error: '', confirmCancel: false });
    try {
      const order = await admin.updateOrderStatus(id, status);
      setResult({ id, order, error: '' });
      setAction({ pending: false, error: '', confirmCancel: false });
    } catch (error) {
      setAction({ pending: false, error: error.message, confirmCancel: false });
    }
  }

  const backLink = (
    <Link to="/admin/commandes" className="inline-flex items-center gap-2 text-sm font-bold text-ciel">
      <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="size-4" />
      Toutes les commandes
    </Link>
  );

  if (result.id !== id) {
    return (
      <p role="status" className="p-10 text-brume">
        Chargement…
      </p>
    );
  }
  if (result.error) {
    return (
      <div className="p-6 lg:p-10">
        {backLink}
        <p role="alert" className="mt-6 text-erreur">
          {result.error}
        </p>
      </div>
    );
  }

  const { order } = result;
  const wasPaid = ['PAID', 'SHIPPED'].includes(order.status);

  return (
    <div className="p-6 lg:p-10">
      <title>{`Commande ${order.number} · Administration Orbea`}</title>
      {backLink}
      <div className="mt-4">
        <AdminPageHeader
          title={`Commande ${order.number}`}
          subtitle={`Passée le ${formatDateTime(order.createdAt)}${order.paidAt ? ` · payée le ${formatDateTime(order.paidAt)}` : ''}`}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className="overflow-x-auto rounded-carte border border-trait">
            <table className={tableClass}>
              <thead className="border-b border-trait">
                <tr>
                  <th scope="col" className={thClass}>
                    Article
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Prix payé
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Qté
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trait">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className={tdClass}>
                      <span className="font-bold">{item.productName}</span>
                      <span className="block text-brume">{item.variantLabel}</span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>{formatPrice(item.unitPriceCents)}</td>
                    <td className={`${tdClass} text-right`}>{item.quantity}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right font-bold`}>
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-trait">
                <tr>
                  <th scope="row" colSpan={3} className={`${tdClass} text-right`}>
                    Total payé
                  </th>
                  <td className={`${tdClass} whitespace-nowrap text-right text-lg font-bold`}>
                    {formatPrice(order.totalCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-carte border border-trait p-5">
              <h2 className="font-bold">Client</h2>
              <p className={`mt-2 ${order.customer.anonymized ? 'italic text-brume' : ''}`}>{order.customer.name}</p>
              {order.customer.email && <p className="text-brume">{order.customer.email}</p>}
              {order.customer.anonymized && (
                <p className="mt-2 text-sm text-brume">Compte supprimé : données personnelles anonymisées (RGPD).</p>
              )}
            </section>
            <section className="rounded-carte border border-trait p-5">
              <h2 className="font-bold">Livraison</h2>
              {order.shipping ? (
                <address className="mt-2 not-italic text-brume">
                  {order.shipping.name}
                  <br />
                  {order.shipping.address}
                  <br />
                  {order.shipping.postalCode} {order.shipping.city}
                </address>
              ) : (
                <p className="mt-2 text-brume">
                  {order.hasGoodies ? 'Adresse effacée.' : 'Voyage seul : pas de livraison.'}
                </p>
              )}
            </section>
          </div>
        </div>

        <aside aria-labelledby="titre-statut" className="self-start rounded-carte bg-stratosphere p-6">
          <h2 id="titre-statut" className="font-display text-[22px] font-bold">
            Statut
          </h2>
          <div className="mt-3">
            <OrderStatusBadge status={order.status} />
          </div>

          {order.allowedTransitions.length === 0 ? (
            <p className="mt-4 text-sm text-brume">
              {ORDER_STATUS[order.status].label} : plus aucun changement possible.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {order.allowedTransitions
                .filter((status) => status !== 'CANCELLED')
                .map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={action.pending}
                    onClick={() => changeStatus(status)}
                    className={primaryButton}
                  >
                    {ACTION_LABELS[status]}
                  </button>
                ))}

              {order.allowedTransitions.includes('CANCELLED') &&
                (action.confirmCancel ? (
                  <div className="rounded-champ border border-erreur/50 p-4">
                    <p className="text-sm">
                      {wasPaid
                        ? 'Le client sera remboursé via Stripe et les places ou articles remis en stock. Confirmer ?'
                        : 'Confirmer l’annulation de cette commande non payée ?'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={action.pending}
                        onClick={() => changeStatus('CANCELLED')}
                        className={`${secondaryButton} border-erreur/60 text-erreur`}
                      >
                        Oui, annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => setAction((a) => ({ ...a, confirmCancel: false }))}
                        className={secondaryButton}
                      >
                        Non
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={action.pending}
                    onClick={() => setAction((a) => ({ ...a, confirmCancel: true, error: '' }))}
                    className={`${secondaryButton} border-erreur/60 text-erreur`}
                  >
                    {ACTION_LABELS.CANCELLED}
                  </button>
                ))}
            </div>
          )}

          <div aria-live="polite">
            {action.error && (
              <p role="alert" className="mt-4 text-sm text-erreur">
                {action.error}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AdminOrderDetailPage;
