import { useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ShoppingBag, Trash2 } from 'lucide-react';
import ProductImage from '../../components/ui/ProductImage.jsx';
import QuantityStepper from '../../components/ui/QuantityStepper.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useCart } from '../../context/useCart.js';
import { formatPrice } from '../../utils/format.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const primaryButton = `inline-flex h-12 w-full items-center justify-center rounded-full bg-aube px-6 font-bold text-abysse motion-safe:transition hover:bg-aube-survol hover:shadow-lueur-aube ${focusRing}`;

function productPath(item) {
  return `${item.productType === 'TRIP' ? '/destinations' : '/boutique'}/${item.productSlug}`;
}

function CartLine({ item }) {
  const { updateItem, removeItem } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  // Toute modification passe par l'API, qui revérifie le stock et renvoie le panier à jour
  async function run(action) {
    setPending(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  const label =
    item.productType === 'TRIP' ? `Nombre de voyageurs pour ${item.productName}` : `Quantité de ${item.productName}`;

  return (
    <li className="flex gap-4 border-b border-trait py-6 sm:gap-6">
      <ProductImage image={item.image} className="aspect-square w-20 shrink-0 rounded-champ sm:w-28" />

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">
              <Link to={productPath(item)} className={`hover:underline ${focusRing}`}>
                {item.productName}
              </Link>
            </h2>
            <p className="text-sm text-brume">{item.variantLabel}</p>
            <p className="text-sm text-brume">{formatPrice(item.unitPriceCents)} l'unité</p>
          </div>
          <p className="text-lg font-bold">{formatPrice(item.lineTotalCents)}</p>
        </div>

        {item.issue && (
          <p className="flex items-start gap-2 text-sm text-vigilance">
            <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
            {item.issue}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {item.maxQuantity > 0 ? (
            <QuantityStepper
              value={item.quantity}
              // Si le stock a baissé, on peut toujours diminuer jusqu'à revenir dans la limite
              max={Math.max(item.maxQuantity, 1)}
              onChange={(quantity) => run(() => updateItem(item.variantId, quantity))}
              label={label}
              disabled={pending}
            />
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => run(() => removeItem(item.variantId))}
            disabled={pending}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-brume hover:text-neige ${focusRing}`}
          >
            <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
            Retirer<span className="sr-only"> {item.productName}</span>
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-erreur">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

function CartPage() {
  const { cart, isLoading } = useCart();
  const { user } = useAuth();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-16 lg:py-16">
      <title>Panier · Orbea Spacelines</title>
      <h1 className="font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">Votre panier</h1>

      {isLoading && (
        <p role="status" className="mt-8 text-brume">
          Chargement du panier…
        </p>
      )}

      {!isLoading && cart.items.length === 0 && (
        <div className="mt-10 rounded-carte border border-trait p-10 text-center">
          <ShoppingBag aria-hidden="true" strokeWidth={1.5} className="mx-auto size-10 text-aube" />
          <p className="mt-4 font-display text-[22px] font-bold">Votre panier est vide</p>
          <p className="mt-2 text-brume">Découvrez nos destinations et nos souvenirs pour préparer votre voyage.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/destinations" className={`${primaryButton} sm:w-auto`}>
              Voir les destinations
            </Link>
            <Link
              to="/boutique"
              className={`inline-flex h-12 items-center justify-center rounded-full border border-contour px-6 font-bold hover:bg-stratosphere-haute ${focusRing}`}
            >
              Visiter la boutique
            </Link>
          </div>
        </div>
      )}

      {!isLoading && cart.items.length > 0 && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul aria-label="Articles du panier">
            {cart.items.map((item) => (
              <CartLine key={item.variantId} item={item} />
            ))}
          </ul>

          <aside aria-labelledby="titre-recapitulatif" className="self-start rounded-carte bg-stratosphere p-6">
            <h2 id="titre-recapitulatif" className="font-display text-[22px] font-bold">
              Récapitulatif
            </h2>
            <dl className="mt-6 flex flex-col gap-3">
              <div className="flex justify-between text-brume">
                <dt>Articles</dt>
                <dd>{cart.itemCount}</dd>
              </div>
              <div className="flex justify-between border-t border-trait pt-3 text-lg font-bold">
                <dt>Total</dt>
                <dd aria-live="polite">{formatPrice(cart.subtotalCents)}</dd>
              </div>
            </dl>

            {cart.hasIssues ? (
              <p className="mt-6 flex items-start gap-2 text-sm text-vigilance">
                <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0" />
                Certains articles ne sont plus disponibles dans la quantité demandée. Ajustez ou retirez-les pour
                continuer.
              </p>
            ) : (
              <>
                <Link to="/commande" className={`mt-6 ${primaryButton}`}>
                  {user ? 'Passer au paiement' : 'Se connecter pour payer'}
                </Link>
                {!user && (
                  <p className="mt-3 text-sm text-brume">Un compte est nécessaire pour finaliser votre commande.</p>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartPage;
