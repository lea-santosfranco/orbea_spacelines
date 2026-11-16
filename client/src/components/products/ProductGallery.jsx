import { useState } from 'react';
import ProductImage from '../ui/ProductImage.jsx';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

// Grande image + miniatures cliquables pour changer l'image affichée
function ProductGallery({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? null;

  return (
    <div>
      <ProductImage key={activeImage?.id ?? 'vide'} image={activeImage} className="aspect-[4/3] w-full rounded-carte" />

      {images.length > 1 && (
        <ul className="mt-4 grid grid-cols-4 gap-3" aria-label="Autres images">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Afficher l'image ${index + 1} : ${image.altText}`}
                aria-pressed={index === activeIndex}
                className={`block w-full overflow-hidden rounded-champ border-2 ${
                  index === activeIndex ? 'border-aube' : 'border-transparent opacity-70 hover:opacity-100'
                } ${focusRing}`}
              >
                <ProductImage image={image} className="aspect-[4/3] w-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductGallery;
