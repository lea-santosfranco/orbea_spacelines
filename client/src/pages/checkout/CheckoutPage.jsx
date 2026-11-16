import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, Lock } from 'lucide-react';
import CheckoutSteps from '../../components/checkout/CheckoutSteps.jsx';
import FormField from '../../components/ui/FormField.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useCart } from '../../context/useCart.js';
import { createCheckout } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

// Transforme les erreurs de validation de l'API en { champ: message }
function fieldErrors(error) {
  const errors = {};
  for (const detail of error.details ?? []) {
    const field = detail.field.replace('shipping.', '');
    if (!errors[field]) errors[field] = detail.message;
  }
  return errors;
}

function CheckoutPage() {
  const { user } = useAuth();
  const { cart, isLoading } = useCart();
  const [searchParams] = useSearchParams();
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentCancelled = searchParams.get('paiement') === 'annule';
  const hasGoodies = cart.items.some((item) => item.productType === 'GOODIE');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setErrors({});
    setMessage('');

    try {
      const { url } = await createCheckout({
        cgvAccepted: form.get('cgv') === 'on',
        ...(hasGoodies && {
          shipping: {
            name: form.get('name'),
            address: form.get('address'),
            postalCode: form.get('postalCode'),
            city: form.get('city'),
          },
        }),
      });
      // Redirection vers la page de paiement hébergée par Stripe : la carte n'est jamais saisie sur notre site
      window.location.assign(url);
    } catch (error) {
      setErrors(fieldErrors(error));
      if (!error.details) setMessage(error.message);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <p role="status" className="px-4 py-24 text-center text-brume">
        Chargement…
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-16 lg:py-16">
      <title>Récapitulatif de commande · Orbea Spacelines</title>
      <CheckoutSteps current={1} />
      <h1 className="mt-8 font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">Récapitulatif</h1>

      {paymentCancelled && (
        <p role="alert" className="mt-6 rounded-champ border border-vigilance/50 bg-stratosphere p-4 text-vigilance">
          Le paiement n'a pas abouti. Votre panier est conservé : vous pouvez réessayer.
        </p>
      )}

      {cart.items.length === 0 ? (
        <div className="mt-8 rounded-carte border border-trait p-8 text-center">
          <p className="text-brume">Votre panier est vide.</p>
          <Link to="/destinations" className="mt-4 inline-block font-bold text-ciel underline">
            Voir les destinations
          </Link>
        </div>
      ) : cart.hasIssues ? (
        <div className="mt-8 flex items-start gap-3 rounded-carte border border-vigilance/50 p-6 text-vigilance">
          <AlertTriangle aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-5 shrink-0" />
          <p>
            Certains articles de votre panier ne sont plus disponibles.{' '}
            <Link to="/panier" className="font-bold underline">
              Corriger mon panier
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-10">
            <section aria-labelledby="titre-articles">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="titre-articles" className="font-display text-[22px] font-bold">
                  Vos articles
                </h2>
                <Link to="/panier" className="text-sm font-bold text-ciel underline">
                  Modifier le panier
                </Link>
              </div>
              <ul className="mt-4 divide-y divide-trait rounded-carte border border-trait">
                {cart.items.map((item) => (
                  <li key={item.variantId} className="flex flex-wrap justify-between gap-2 p-4">
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
            </section>

            <section aria-labelledby="titre-coordonnees">
              <h2 id="titre-coordonnees" className="font-display text-[22px] font-bold">
                Vos coordonnées
              </h2>
              <p className="mt-4 text-brume">
                {user.firstName} {user.lastName} · {user.email}
              </p>
            </section>

            {hasGoodies && (
              <fieldset className="flex flex-col gap-5">
                <legend className="font-display text-[22px] font-bold">Adresse de livraison des goodies</legend>
                <FormField
                  label="Nom du destinataire"
                  name="name"
                  autoComplete="name"
                  required
                  defaultValue={`${user.firstName} ${user.lastName}`}
                  error={errors.name}
                />
                <FormField
                  label="Adresse"
                  name="address"
                  autoComplete="street-address"
                  required
                  defaultValue={user.address ?? ''}
                  error={errors.address}
                />
                <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
                  <FormField
                    label="Code postal"
                    name="postalCode"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    required
                    defaultValue={user.postalCode ?? ''}
                    error={errors.postalCode}
                  />
                  <FormField
                    label="Ville"
                    name="city"
                    autoComplete="address-level2"
                    required
                    defaultValue={user.city ?? ''}
                    error={errors.city}
                  />
                </div>
              </fieldset>
            )}
          </div>

          <aside aria-labelledby="titre-paiement" className="self-start rounded-carte bg-stratosphere p-6">
            <h2 id="titre-paiement" className="font-display text-[22px] font-bold">
              Paiement
            </h2>
            <dl className="mt-6 flex flex-col gap-3">
              <div className="flex justify-between text-brume">
                <dt>Sous-total</dt>
                <dd>{formatPrice(cart.subtotalCents)}</dd>
              </div>
              {hasGoodies && (
                <div className="flex justify-between text-brume">
                  <dt>Livraison</dt>
                  <dd>Offerte</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-trait pt-3 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatPrice(cart.subtotalCents)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-brume">
                <input
                  type="checkbox"
                  name="cgv"
                  required
                  aria-invalid={errors.cgvAccepted ? true : undefined}
                  aria-describedby={errors.cgvAccepted ? 'erreur-cgv' : undefined}
                  className={`mt-0.5 size-4 shrink-0 accent-aube ${focusRing}`}
                />
                <span>
                  J'ai lu et j'accepte les{' '}
                  <Link to="/cgv" target="_blank" className="text-ciel underline">
                    conditions générales de vente
                  </Link>
                  .
                </span>
              </label>
              {errors.cgvAccepted && (
                <p id="erreur-cgv" className="mt-2 text-sm text-erreur">
                  {errors.cgvAccepted}
                </p>
              )}
            </div>

            {message && (
              <p role="alert" className="mt-4 text-sm text-erreur">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-aube px-6 font-bold text-abysse motion-safe:transition hover:bg-aube-survol hover:shadow-lueur-aube disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
            >
              <Lock aria-hidden="true" strokeWidth={1.5} className="size-4" />
              {isSubmitting ? 'Redirection vers Stripe…' : 'Payer avec Stripe'}
            </button>

            <p className="mt-4 text-xs text-brume">
              Paiement sécurisé par Stripe. Aucune donnée bancaire n'est enregistrée sur nos serveurs. Le stock est
              vérifié une dernière fois avant le paiement.
            </p>
            <p className="mt-2 text-xs text-brume">
              Site de démonstration : utilisez la carte de test 4242 4242 4242 4242, une date future et n'importe quel
              code.
            </p>
          </aside>
        </form>
      )}
    </section>
  );
}

export default CheckoutPage;
