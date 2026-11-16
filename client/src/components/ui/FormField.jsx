import { useId } from 'react';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

// Champ de formulaire accessible : libellé, aide et message d'erreur reliés au champ
function FormField({ label, error, hint, className = '', ...inputProps }) {
  const id = useId();
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`mt-2 h-12 w-full rounded-champ border bg-stratosphere-haute px-4 text-neige ${focusRing} ${
          error ? 'border-erreur' : 'border-contour'
        }`}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="mt-2 text-sm text-brume">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-erreur">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
