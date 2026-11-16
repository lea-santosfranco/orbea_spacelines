import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Check } from 'lucide-react';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import { getOrder } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import { formatDateTime, ORDER_STATUS } from '../../utils/orders.js';

// Étapes de suivi : l'expédition ne concerne que les commandes avec des goodies
function timelineSteps(order) {
  return order.shipping ? ['PAID', 'SHIPPED', 'COMPLETED'] : ['PAID', 'COMPLETED'];
}

function OrderTimeline({ order }) {
  const steps = timelineSteps(order);
  const currentIndex = steps.indexOf(order.status);

  return (
    <ol aria-label="Suivi de la commande" className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
      {steps.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li
            key={step}
            aria-current={index === currentIndex ? 'step' : undefined}
            className={`flex items-center gap-2 text-sm ${done ? 'font-bold text-neige' : 'text-brume'}`}
          >
            <span
              className={`flex size-6 items-center justify-center rounded-full ${
                done ? 'bg-aube text-abysse' : 'border border-contour'
              }`}
            >
              {done && <Check aria-hidden="true" strokeWidth={2.5} className="size-3.5" />}
            </span>
            {ORDER_STATUS[step].label}
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, order: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    getOrder(id, { signal: controller.signal })
      .then((order) => setResult({ id, order, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ id, order: null, error });
      });
    return () => controller.abort();
  }, [id]);

  const backLink = (
    <Link to="/compte/commandes" className="inline-flex items-center gap-2 text-sm font-bold text-ciel">
      <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="size-4" />
      Toutes mes commandes
    </Link>
  );

  if (result.id !== id) {
    return (
      <p role="status" className="text-brume">
        Chargement de la commande…
      </p>
    );
  }

  if (result.error) {
    return (
      <div>
        {backLink}
        <p role="alert" className="mt-6 rounded-carte bg-stratosphere p-6 text-brume">
          {result.error.status === 404 ? 'Cette commande est introuvable.' : "La commande n'a pas pu être chargée."}
        </p>
      </div>
    );
  }

  const { order } = result;

  return (
    <article>
      <title>{`Commande ${order.number} · Orbea Spacelines`}</title>
      {backLink}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-[28px] font-extrabold leading-[1.1]">Commande {order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-brume">
        Passée le {formatDateTime(order.createdAt)}
        {order.paidAt && ` · payée le ${formatDateTime(order.paidAt)}`}
      </p>

      {order.status !== 'CANCELLED' && order.status !== 'PENDING_PAYMENT' && <OrderTimeline order={order} />}

      <section aria-labelledby="titre-articles" className="mt-10">
        <h2 id="titre-articles" className="font-display text-[22px] font-bold">
          Articles
        </h2>
        <div className="mt-4 overflow-x-auto rounded-carte border border-trait">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-trait text-brume">
              <tr>
                <th scope="col" className="p-4 font-bold">
                  Article
                </th>
                <th scope="col" className="p-4 text-right font-bold">
                  Prix payé
                </th>
                <th scope="col" className="p-4 text-right font-bold">
                  Quantité
                </th>
                <th scope="col" className="p-4 text-right font-bold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trait">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="p-4">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-brume">{item.variantLabel}</p>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">{formatPrice(item.unitPriceCents)}</td>
                  <td className="p-4 text-right">{item.quantity}</td>
                  <td className="p-4 text-right font-bold whitespace-nowrap">{formatPrice(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="titre-livraison" className="rounded-carte border border-trait p-6">
          <h2 id="titre-livraison" className="font-display text-lg font-bold">
            Livraison
          </h2>
          {order.shipping ? (
            <address className="mt-3 not-italic text-brume">
              {order.shipping.name}
              <br />
              {order.shipping.address}
              <br />
              {order.shipping.postalCode} {order.shipping.city}
            </address>
          ) : (
            <p className="mt-3 text-brume">
              Voyage uniquement : aucune livraison, votre réservation est confirmée ici.
            </p>
          )}
        </section>

        <section aria-labelledby="titre-montants" className="rounded-carte bg-stratosphere p-6">
          <h2 id="titre-montants" className="font-display text-lg font-bold">
            Montants
          </h2>
          <dl className="mt-3 flex flex-col gap-2">
            <div className="flex justify-between text-brume">
              <dt>Sous-total</dt>
              <dd>{formatPrice(order.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between text-brume">
              <dt>Livraison</dt>
              <dd>{order.shippingCents === 0 ? 'Offerte' : formatPrice(order.shippingCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-trait pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
  );
}

export default OrderDetailPage;
