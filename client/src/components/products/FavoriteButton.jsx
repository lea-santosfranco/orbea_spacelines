import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { useFavorites } from '../../context/useFavorites.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

// Bouton cœur : ajoute ou retire un produit des favoris (connexion demandée pour un visiteur)
function FavoriteButton({ productId, productName, className = '' }) {
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);

  const isFavorite = favoriteIds.has(productId);

  async function handleClick(event) {
    event.preventDefault();
    if (!user) {
      navigate(`/connexion?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setPending(true);
    try {
      await toggle(productId);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Retirer ${productName} des favoris` : `Ajouter ${productName} aux favoris`}
      className={`relative z-10 flex size-11 items-center justify-center rounded-full bg-abysse/70 backdrop-blur motion-safe:transition hover:bg-abysse disabled:opacity-60 ${focusRing} ${className}`}
    >
      <Heart
        aria-hidden="true"
        strokeWidth={1.5}
        className={`size-5 ${isFavorite ? 'fill-aube text-aube' : 'text-neige'}`}
      />
    </button>
  );
}

export default FavoriteButton;
