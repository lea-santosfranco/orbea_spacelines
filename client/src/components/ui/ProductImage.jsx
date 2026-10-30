import { useState } from 'react';

// Affiche l'image du produit, ou un visuel de remplacement si elle manque
function ProductImage({ image, className = '' }) {
  const [hasError, setHasError] = useState(false);

  if (!image || hasError) {
    return (
      <div aria-hidden="true" className={`relative overflow-hidden bg-stratosphere-haute ${className}`}>
        <div className="absolute left-1/2 top-[62%] aspect-square w-[160%] -translate-x-1/2 rounded-full border-t border-aube/60 bg-abysse shadow-[0_-8px_40px_rgba(255,138,80,0.4)]" />
      </div>
    );
  }

  return (
    <img
      src={image.url}
      alt={image.altText}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}

export default ProductImage;