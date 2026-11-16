import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Star, Trash2 } from 'lucide-react';
import StarRating from './StarRating.jsx';
import { useAuth } from '../../context/useAuth.js';
import { admin, createReview, deleteMyReview, getReviews } from '../../services/api.js';
import { fieldErrors } from '../../utils/formErrors.js';
import { formatDateTime } from '../../utils/orders.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const smallButton = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-brume hover:text-neige ${focusRing}`;

function ReviewForm({ slug, onSaved }) {
  const id = useId();
  const [rating, setRating] = useState(0);
  const [state, setState] = useState({ pending: false, errors: {}, message: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    const comment = new FormData(event.currentTarget).get('comment');
    setState({ pending: true, errors: {}, message: '' });
    try {
      onSaved(await createReview(slug, { rating, comment }));
    } catch (error) {
      setState({ pending: false, errors: fieldErrors(error), message: error.details ? '' : error.message });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4 rounded-carte border border-trait p-6">
      <h3 className="font-display text-lg font-bold">Donner mon avis</h3>

      <fieldset>
        <legend className="text-sm font-bold">Votre note</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              className={`cursor-pointer rounded-full p-1 has-focus-visible:outline-2 has-focus-visible:outline-aube`}
            >
              <input
                type="radio"
                name={`${id}-note`}
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
              />
              <span className="sr-only">{value === 1 ? '1 étoile' : `${value} étoiles`}</span>
              <Star
                aria-hidden="true"
                strokeWidth={1.5}
                className={`size-7 ${value <= rating ? 'fill-aube text-aube' : 'text-contour hover:text-aube'}`}
              />
            </label>
          ))}
        </div>
        {state.errors.rating && <p className="mt-1 text-sm text-erreur">{state.errors.rating}</p>}
      </fieldset>

      <div>
        <label htmlFor={`${id}-comment`} className="text-sm font-bold">
          Votre commentaire
        </label>
        <textarea
          id={`${id}-comment`}
          name="comment"
          rows={4}
          maxLength={1000}
          required
          aria-invalid={state.errors.comment ? true : undefined}
          className={`mt-2 w-full rounded-champ border bg-stratosphere-haute p-3 text-neige ${focusRing} ${
            state.errors.comment ? 'border-erreur' : 'border-contour'
          }`}
        />
        {state.errors.comment && <p className="mt-1 text-sm text-erreur">{state.errors.comment}</p>}
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-erreur">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={state.pending}
        className={`inline-flex h-11 items-center justify-center self-start rounded-full bg-aube px-6 font-bold text-abysse hover:bg-aube-survol disabled:opacity-60 ${focusRing}`}
      >
        {state.pending ? 'Publication…' : 'Publier mon avis'}
      </button>
    </form>
  );
}

// Section « Avis » de la fiche produit : moyenne, liste, formulaire pour les acheteurs
function ProductReviews({ slug }) {
  const { user } = useAuth();
  const location = useLocation();
  const requestKey = `${slug}|${user?.id ?? ''}`;
  const [result, setResult] = useState({ key: null, data: null });
  const [error, setError] = useState('');

  // Rechargé à la connexion / déconnexion : le formulaire dépend de l'utilisateur
  useEffect(() => {
    const controller = new AbortController();
    getReviews(slug, { signal: controller.signal })
      .then((data) => setResult({ key: requestKey, data }))
      .catch(() => {});
    return () => controller.abort();
  }, [slug, requestKey]);

  const data = result.key === requestKey ? result.data : null;
  const update = (next) => setResult({ key: requestKey, data: next });

  async function removeMine() {
    setError('');
    try {
      update(await deleteMyReview(slug));
    } catch (err) {
      setError(err.message);
    }
  }

  async function moderate(reviewId) {
    setError('');
    try {
      await admin.deleteReview(reviewId);
      update(await getReviews(slug));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section aria-labelledby="titre-avis" className="mt-16 max-w-3xl">
      <div className="flex flex-wrap items-center gap-4">
        <h2 id="titre-avis" className="font-display text-[22px] font-bold">
          Avis des voyageurs
        </h2>
        {data?.count > 0 && (
          <p className="flex items-center gap-2 text-brume">
            <StarRating value={data.average} />
            <span>
              {String(data.average).replace('.', ',')} / 5 · {data.count} avis
            </span>
          </p>
        )}
      </div>

      {!data && (
        <p role="status" className="mt-4 text-brume">
          Chargement des avis…
        </p>
      )}

      {data && data.count === 0 && <p className="mt-4 text-brume">Aucun avis pour le moment.</p>}

      {data && data.items.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4">
          {data.items.map((review) => (
            <li key={review.id} className="rounded-carte bg-stratosphere p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-3">
                  <StarRating value={review.rating} />
                  <span className="font-bold">{review.author}</span>
                </p>
                <p className="text-sm text-brume">{formatDateTime(review.createdAt)}</p>
              </div>
              {/* Le commentaire est affiché comme du texte : React échappe tout contenu HTML (protection XSS) */}
              <p className="mt-3 whitespace-pre-line text-brume">{review.comment}</p>
              <div className="mt-2 flex justify-end">
                {review.isMine && (
                  <button type="button" onClick={removeMine} className={smallButton}>
                    <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    Supprimer mon avis
                  </button>
                )}
                {!review.isMine && user?.role === 'ADMIN' && (
                  <button type="button" onClick={() => moderate(review.id)} className={smallButton}>
                    <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    Retirer (modération)<span className="sr-only"> l'avis de {review.author}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-erreur">
          {error}
        </p>
      )}

      {data?.canReview && <ReviewForm slug={slug} onSaved={update} />}
      {data && !data.canReview && !user && (
        <p className="mt-6 text-sm text-brume">
          <Link
            to={`/connexion?redirect=${encodeURIComponent(location.pathname)}`}
            className="font-bold text-ciel underline"
          >
            Connectez-vous
          </Link>{' '}
          pour donner votre avis sur un produit que vous avez acheté.
        </p>
      )}
    </section>
  );
}

export default ProductReviews;
