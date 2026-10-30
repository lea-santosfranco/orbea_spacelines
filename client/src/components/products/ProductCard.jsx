import { Link } from 'react-router';
import ProductImage from '../ui/ProductImage.jsx';
import { formatDuration, formatPrice } from '../../utils/format.js';

function ProductCard({ product }) {
  const basePath = product.type === 'TRIP' ? '/destinations' : '/boutique';
  const soldOutLabel = product.type === 'TRIP' ? 'Complet' : 'Épuisé';

  return (
    <article
      className={`group relative flex w-full flex-col overflow-hidden rounded-carte bg-stratosphere ${
        product.isAvailable ? '' : 'opacity-60'
      }`}
    >
      <ProductImage image={product.image} className="aspect-[16/10] w-full" />

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">{product.category.name}</p>

        <h3 className="mt-2 font-display text-[22px] font-bold leading-7">
          <Link
            to={`${basePath}/${product.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-has-[:focus-visible]:underline"
          >
            {product.name}
          </Link>
        </h3>

        {product.durationDays && <p className="mt-1 text-sm text-brume">{formatDuration(product.durationDays)}</p>}

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          {product.minPriceCents !== null && (
            <p className="text-brume">
              <span className="text-sm">À partir de</span>{' '}
              <span className="text-lg font-bold text-neige">{formatPrice(product.minPriceCents)}</span>
            </p>
          )}
          {!product.isAvailable && (
            <span className="rounded-full border border-contour px-3 py-1 text-xs font-bold text-brume">
              {soldOutLabel}
            </span>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-carte ring-aube group-has-[:focus-visible]:ring-2" />
    </article>
  );
}

export default ProductCard;