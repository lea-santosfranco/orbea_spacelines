import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Clock } from 'lucide-react';
import ProductGallery from '../../components/products/ProductGallery.jsx';
import TripDepartures from '../../components/products/TripDepartures.jsx';
import SizePicker from '../../components/products/SizePicker.jsx';
import AddToCart from '../../components/products/AddToCart.jsx';
import FavoriteButton from '../../components/products/FavoriteButton.jsx';
import ProductReviews from '../../components/products/ProductReviews.jsx';
import NotFoundPage from '../NotFoundPage.jsx';
import { getProduct } from '../../services/api.js';
import { formatDate, formatDuration, formatPrice, TRAVEL_CLASS_LABELS } from '../../utils/format.js';

const SECTIONS = {
  TRIP: { label: 'Destinations', path: '/destinations' },
  GOODIE: { label: 'Boutique', path: '/boutique' },
};

// Phrase qui résume la variante choisie (ou ce qu'il reste à faire)
function selectionMessage(product, selected) {
  if (!product.isAvailable) {
    return product.type === 'TRIP' ? 'Ce voyage est complet.' : 'Cet article est épuisé.';
  }
  if (!selected) {
    return product.type === 'TRIP' ? 'Sélectionnez une date et une classe de voyage.' : 'Sélectionnez une taille.';
  }
  if (product.type === 'TRIP') {
    return `Votre sélection : départ le ${formatDate(selected.departureDate)}, classe ${
      TRAVEL_CLASS_LABELS[selected.travelClass]
    }, ${formatPrice(selected.priceCents)} par voyageur.`;
  }
  const stockNote = selected.stock <= 5 ? ` Plus que ${selected.stock} en stock.` : ' En stock.';
  const sizeNote = product.variants.length > 1 ? `taille ${selected.size}, ` : '';
  return `Votre sélection : ${sizeNote}${formatPrice(selected.priceCents)}.${stockNote}`;
}

function ProductDetail({ slug, type }) {
  const section = SECTIONS[type];
  const [result, setResult] = useState({ status: 'loading', product: null });
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getProduct(slug, { signal: controller.signal })
      .then((product) => setResult({ status: 'success', product }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setResult({ status: error.status === 404 ? 'not-found' : 'error', product: null });
      });

    return () => controller.abort();
  }, [slug]);

  const { status, product } = result;

  // Un goodie ouvert depuis /destinations (ou l'inverse) est traité comme introuvable
  if (status === 'not-found' || (product && product.type !== type)) {
    return <NotFoundPage />;
  }

  if (status === 'loading') {
    return (
      <section aria-busy="true" aria-label="Chargement du produit" className="mx-auto max-w-7xl px-4 py-12 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-[4/3] rounded-carte bg-stratosphere motion-safe:animate-pulse" />
          <div className="h-80 rounded-carte bg-stratosphere motion-safe:animate-pulse" />
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-16">
        <p role="alert" className="rounded-carte bg-stratosphere p-6 text-brume">
          Ce produit n'a pas pu être chargé. Réessayez dans quelques instants.
        </p>
      </section>
    );
  }

  // Article à taille unique : la seule variante est choisie d'office (si elle est en stock)
  const singleVariant = product.type === 'GOODIE' && product.variants.length === 1 ? product.variants[0] : null;
  const selected =
    product.variants.find((variant) => variant.id === selectedId) ??
    (singleVariant && singleVariant.stock > 0 ? singleVariant : null);

  return (
    <article className="mx-auto max-w-7xl px-4 py-12 lg:px-16 lg:py-16">
      <title>{`${product.name} · Orbea Spacelines`}</title>

      <nav aria-label="Fil d'Ariane" className="text-sm text-brume">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link to="/" className="hover:text-neige">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={section.path} className="hover:text-neige">
              {section.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-neige">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} />

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">{product.category.name}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="break-words font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">
              {product.name}
            </h1>
            <FavoriteButton
              productId={product.id}
              productName={product.name}
              className="shrink-0 border border-contour"
            />
          </div>

          {product.durationDays && (
            <p className="mt-4 flex items-center gap-2 text-brume">
              <Clock aria-hidden="true" strokeWidth={1.5} className="size-5" />
              {formatDuration(product.durationDays)}
            </p>
          )}

          {product.minPriceCents !== null && (
            <p className="mt-4 text-brume">
              {product.hasPriceRange && 'À partir de '}
              <span className="text-2xl font-bold text-neige">{formatPrice(product.minPriceCents)}</span>
            </p>
          )}

          {product.type === 'TRIP' && (
            <>
              <h2 className="mt-10 font-display text-[22px] font-bold">Choisir un départ</h2>
              <TripDepartures variants={product.variants} selectedId={selectedId} onSelect={setSelectedId} />
            </>
          )}

          {product.type === 'GOODIE' &&
            (singleVariant ? (
              <p className="mt-10 text-brume">Taille unique</p>
            ) : (
              <>
                <h2 className="mt-10 font-display text-[22px] font-bold">Choisir une taille</h2>
                <SizePicker variants={product.variants} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
              </>
            ))}

          {/* Récapitulatif de la sélection, annoncé aux lecteurs d'écran */}
          <p aria-live="polite" className="mt-6 rounded-champ bg-stratosphere p-4 text-brume">
            {selectionMessage(product, selected)}
          </p>

          {product.isAvailable && (
            // La clé remet la quantité à 1 quand on change de départ ou de taille
            <AddToCart key={selected?.id ?? 'aucune'} variant={selected} isTrip={product.type === 'TRIP'} />
          )}
        </div>
      </div>

      <section aria-labelledby="titre-description" className="mt-16 max-w-3xl">
        <h2 id="titre-description" className="font-display text-[22px] font-bold">
          Description
        </h2>
        <p className="mt-4 whitespace-pre-line text-lg text-brume">{product.description}</p>
      </section>

      <ProductReviews slug={product.slug} />
    </article>
  );
}

// La clé force une remise à zéro complète (sélection, chargement) quand on passe d'un produit à un autre
function ProductDetailPage({ type }) {
  const { slug } = useParams();
  return <ProductDetail key={slug} slug={slug} type={type} />;
}

export default ProductDetailPage;
