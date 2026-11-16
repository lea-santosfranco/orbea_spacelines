import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import QuantityStepper from '../ui/QuantityStepper.jsx';
import { useCart } from '../../context/useCart.js';
import { formatPrice } from '../../utils/format.js';

const MAX_PER_LINE = 10;
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

// Choix de la quantité et bouton « Ajouter au panier » pour la variante sélectionnée
function AddToCart({ variant, isTrip }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const max = variant ? Math.min(variant.stock, MAX_PER_LINE) : 1;
  const label = isTrip ? 'Nombre de voyageurs' : 'Quantité';

  async function handleAdd() {
    setStatus({ type: 'pending', message: '' });
    try {
      await addItem(variant.id, quantity);
      setStatus({ type: 'success', message: 'Ajouté au panier' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-bold">{label}</span>
        <QuantityStepper
          value={quantity}
          max={max}
          onChange={(value) => {
            setQuantity(value);
            setStatus({ type: 'idle', message: '' });
          }}
          label={label}
          disabled={!variant}
        />
        {variant && (
          <span className="text-brume">
            Total : <span className="font-bold text-neige">{formatPrice(variant.priceCents * quantity)}</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!variant || status.type === 'pending'}
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-aube px-6 font-bold text-abysse motion-safe:transition hover:bg-aube-survol hover:shadow-lueur-aube disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none sm:self-start ${focusRing}`}
      >
        <ShoppingBag aria-hidden="true" strokeWidth={1.5} className="size-5" />
        {status.type === 'pending' ? 'Ajout…' : 'Ajouter au panier'}
      </button>

      {/* Zone annoncée par les lecteurs d'écran : confirmation ou erreur */}
      <div aria-live="polite">
        {status.type === 'success' && (
          <p className="flex items-center gap-2 text-succes">
            <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="size-5" />
            {status.message}.{' '}
            <Link to="/panier" className="font-bold text-ciel underline">
              Voir le panier
            </Link>
          </p>
        )}
        {status.type === 'error' && (
          <p role="alert" className="text-erreur">
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default AddToCart;
