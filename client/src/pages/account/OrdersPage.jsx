import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, Receipt } from 'lucide-react';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { getOrders } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import { formatDateTime } from '../../utils/orders.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

function OrdersPage() {
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [result, setResult] = useState({ page: null, data: null, error: false });

  useEffect(() => {
    const controller = new AbortController();
    getOrders({ page }, { signal: controller.signal })
      .then((data) => setResult({ page, data, error: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ page, data: null, error: true });
      });
    return () => controller.abort();
  }, [page]);

  const isLoading = result.page !== page;
  const orders = result.data?.items ?? [];

  return (
    <section aria-labelledby="titre-commandes">
      <title>Mes commandes · Orbea Spacelines</title>
      <h1 id="titre-commandes" className="font-display text-[32px] font-extrabold leading-[1.1]">
        Mes commandes
      </h1>

      {isLoading && (
        <p role="status" className="mt-8 text-brume">
          Chargement de vos commandes…
        </p>
      )}

      {!isLoading && result.error && (
        <p role="alert" className="mt-8 rounded-carte bg-stratosphere p-6 text-brume">
          Vos commandes n'ont pas pu être chargées. Réessayez dans quelques instants.
        </p>
      )}

      {!isLoading && !result.error && orders.length === 0 && (
        <div className="mt-8 rounded-carte border border-trait p-10 text-center">
          <Receipt aria-hidden="true" strokeWidth={1.5} className="mx-auto size-10 text-aube" />
          <p className="mt-4 font-display text-[22px] font-bold">Aucune commande pour le moment</p>
          <p className="mt-2 text-brume">Vos voyages et souvenirs achetés apparaîtront ici.</p>
          <Link to="/destinations" className="mt-6 inline-block font-bold text-ciel underline">
            Découvrir les destinations
          </Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <>
          <ul className="mt-8 flex flex-col gap-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/compte/commandes/${order.id}`}
                  className={`group flex items-center gap-4 rounded-carte border border-trait p-5 motion-safe:transition hover:bg-stratosphere ${focusRing}`}
                >
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                    <div className="sm:w-56">
                      <p className="font-bold">{order.number}</p>
                      <p className="text-sm text-brume">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <p className="flex-1 text-sm text-brume">
                      {order.productNames.join(', ')} · {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                    </p>
                    <OrderStatusBadge status={order.status} />
                    <p className="font-bold sm:w-32 sm:text-right">{formatPrice(order.totalCents)}</p>
                  </div>
                  <ChevronRight aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-brume" />
                  <span className="sr-only">Voir le détail</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={result.data.page} totalPages={result.data.totalPages} />
        </>
      )}
    </section>
  );
}

export default OrdersPage;
