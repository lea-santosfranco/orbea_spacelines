import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { focusRing, inputClass, tableClass, tdClass, thClass } from '../../components/admin/adminStyles.js';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { admin } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import { formatDateTime, ORDER_STATUS } from '../../utils/orders.js';

function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = ORDER_STATUS[searchParams.get('statut')] ? searchParams.get('statut') : '';
  const q = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const requestKey = searchParams.toString();
  const [result, setResult] = useState({ key: null, data: null, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    admin
      .getOrders({ status, q, page }, { signal: controller.signal })
      .then((data) => setResult({ key: requestKey, data, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: null, error: error.message });
      });
    return () => controller.abort();
  }, [status, q, page, requestKey]);

  function updateFilters(changes) {
    const next = { statut: status, q, ...changes };
    const params = new URLSearchParams();
    if (next.statut) params.set('statut', next.statut);
    if (next.q) params.set('q', next.q);
    setSearchParams(params);
  }

  const isLoading = result.key !== requestKey;
  const orders = result.data?.items ?? [];

  return (
    <div className="p-6 lg:p-10">
      <title>Commandes · Administration Orbea</title>
      <AdminPageHeader title="Commandes" subtitle={result.data ? `${result.data.total} commande(s)` : ' '} />

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filtre-statut" className="text-sm font-bold">
            Statut
          </label>
          <select
            id="filtre-statut"
            value={status}
            onChange={(event) => updateFilters({ statut: event.target.value })}
            className={`${inputClass} mt-2 w-56`}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(ORDER_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <form
          role="search"
          key={requestKey}
          onSubmit={(event) => {
            event.preventDefault();
            updateFilters({ q: new FormData(event.currentTarget).get('q').trim() });
          }}
          className="relative w-full max-w-xs"
        >
          <label htmlFor="recherche-commande" className="sr-only">
            Rechercher par numéro, e-mail ou nom
          </label>
          <input
            id="recherche-commande"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="N°, e-mail ou nom"
            className={`${inputClass} pl-10`}
          />
          <Search
            aria-hidden="true"
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brume"
          />
        </form>
      </div>

      {isLoading && (
        <p role="status" className="mt-8 text-brume">
          Chargement…
        </p>
      )}
      {!isLoading && result.error && (
        <p role="alert" className="mt-8 text-erreur">
          {result.error}
        </p>
      )}
      {!isLoading && !result.error && orders.length === 0 && <p className="mt-8 text-brume">Aucune commande.</p>}

      {!isLoading && orders.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-carte border border-trait">
            <table className={tableClass}>
              <thead className="border-b border-trait">
                <tr>
                  <th scope="col" className={thClass}>
                    Numéro
                  </th>
                  <th scope="col" className={thClass}>
                    Date
                  </th>
                  <th scope="col" className={thClass}>
                    Client
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Articles
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Total
                  </th>
                  <th scope="col" className={thClass}>
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trait">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stratosphere">
                    <td className={tdClass}>
                      <Link
                        to={`/admin/commandes/${order.id}`}
                        className={`font-bold text-ciel underline ${focusRing}`}
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-brume`}>{formatDateTime(order.createdAt)}</td>
                    <td className={tdClass}>
                      <span className={order.customer.anonymized ? 'italic text-brume' : ''}>
                        {order.customer.name}
                      </span>
                      {order.customer.email && <span className="block text-brume">{order.customer.email}</span>}
                    </td>
                    <td className={`${tdClass} text-right`}>{order.itemCount}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right font-bold`}>
                      {formatPrice(order.totalCents)}
                    </td>
                    <td className={tdClass}>
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={result.data.page} totalPages={result.data.totalPages} />
        </>
      )}
    </div>
  );
}

export default AdminOrdersPage;
