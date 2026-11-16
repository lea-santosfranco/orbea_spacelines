import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import CheckoutSteps from '../../components/checkout/CheckoutSteps.jsx';
import { useCart } from '../../context/useCart.js';
import { getOrder } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 2000;
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Annulé', 'AbortError'));
    });
  });

// Page de retour après Stripe. Le paiement est confirmé par le serveur (jamais par le navigateur) :
// tant que la commande est « en attente », on redemande son statut quelques secondes.
function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('commande');
  const { refresh } = useCart();
  const [state, setState] = useState({ status: 'loading', order: null });

  useEffect(() => {
    if (!orderId) return;
    const controller = new AbortController();

    async function poll() {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const order = await getOrder(orderId, { signal: controller.signal });
        if (order.status !== 'PENDING_PAYMENT') {
          setState({ status: 'done', order });
          if (order.status === 'PAID') refresh().catch(() => {}); // Le serveur a vidé le panier
          return;
        }
        setState({ status: 'pending', order });
        await wait(RETRY_DELAY_MS, controller.signal);
      }
      setState((previous) => ({ ...previous, status: 'timeout' }));
    }

    poll().catch((error) => {
      if (error.name !== 'AbortError') setState({ status: 'error', order: null });
    });

    return () => controller.abort();
  }, [orderId, refresh]);

  const { status, order } = state;
  const isPaid = order?.status === 'PAID';
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 lg:py-16">
      <title>Confirmation de commande · Orbea Spacelines</title>
      <CheckoutSteps current={3} />

      {(!orderId || status === 'error') && (
        <div className="mt-10 rounded-carte border border-trait p-8 text-center">
          <p className="text-brume">Cette commande est introuvable.</p>
          <Link to="/" className="mt-4 inline-block font-bold text-ciel underline">
            Retour à l'accueil
          </Link>
        </div>
      )}

      {orderId && (status === 'loading' || status === 'pending') && (
        <div role="status" className="mt-10 flex flex-col items-center gap-4 text-center">
          <Loader2 aria-hidden="true" strokeWidth={1.5} className="size-10 text-aube motion-safe:animate-spin" />
          <p className="font-display text-[22px] font-bold">Confirmation du paiement en cours…</p>
          <p className="text-brume">Cela ne prend que quelques secondes.</p>
        </div>
      )}

      {status === 'timeout' && (
        <div role="status" className="mt-10 rounded-carte border border-trait p-8 text-center">
          <p className="font-display text-[22px] font-bold">Paiement en cours de vérification</p>
          <p className="mt-2 text-brume">
            La confirmation de Stripe tarde un peu. Votre commande {order?.number} apparaîtra dans votre espace client
            dès qu'elle sera validée.
          </p>
        </div>
      )}

      {status === 'done' && isCancelled && (
        <div className="mt-10 rounded-carte border border-erreur/50 p-8 text-center">
          <XCircle aria-hidden="true" strokeWidth={1.5} className="mx-auto size-12 text-erreur" />
          <h1 className="mt-4 font-display text-[28px] font-extrabold">Le paiement n'a pas abouti</h1>
          <p className="mt-2 text-brume">
            La commande {order.number} a été annulée. Si un paiement a été prélevé, il vous est intégralement remboursé.
          </p>
          <Link
            to="/panier"
            className={`mt-6 inline-flex h-12 items-center rounded-full bg-aube px-6 font-bold text-abysse hover:bg-aube-survol ${focusRing}`}
          >
            Retour au panier
          </Link>
        </div>
      )}

      {status === 'done' && isPaid && (
        <div className="mt-10">
          <div className="text-center">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="mx-auto size-14 text-succes" />
            <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1]">
              Merci, votre commande est confirmée
            </h1>
            <p className="mt-3 text-brume">
              Commande <span className="font-bold text-neige">{order.number}</span> · Payée
            </p>
          </div>

          <div className="mt-10 rounded-carte bg-stratosphere p-6">
            <ul className="divide-y divide-trait">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3">
                  <div>
                    <p className="font-bold">
                      {item.productName} <span className="font-normal text-brume">× {item.quantity}</span>
                    </p>
                    <p className="text-sm text-brume">{item.variantLabel}</p>
                  </div>
                  <p className="font-bold">{formatPrice(item.lineTotalCents)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-trait pt-4 text-lg font-bold">
              <span>Total payé</span>
              <span>{formatPrice(order.totalCents)}</span>
            </p>
            {order.shipping && (
              <p className="mt-4 text-sm text-brume">
                Livraison des goodies : {order.shipping.name}, {order.shipping.address}, {order.shipping.postalCode}{' '}
                {order.shipping.city}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={`/compte/commandes/${order.id}`}
              className={`inline-flex h-12 items-center justify-center rounded-full bg-aube px-6 font-bold text-abysse hover:bg-aube-survol ${focusRing}`}
            >
              Voir ma commande
            </Link>
            <Link
              to="/"
              className={`inline-flex h-12 items-center justify-center rounded-full border border-contour px-6 font-bold hover:bg-stratosphere-haute ${focusRing}`}
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default ConfirmationPage;
