import { Star } from 'lucide-react';

// Affichage d'une note sur 5 en étoiles ; le texte lu par les lecteurs d'écran donne la valeur exacte
function StarRating({ value, size = 'size-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="sr-only">{`Note : ${String(value).replace('.', ',')} sur 5`}</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          strokeWidth={1.5}
          className={`${size} ${star <= Math.round(value) ? 'fill-aube text-aube' : 'text-contour'}`}
        />
      ))}
    </span>
  );
}

export default StarRating;
