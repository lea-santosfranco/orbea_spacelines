import { Minus, Plus } from 'lucide-react';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const buttonClass = `flex size-11 items-center justify-center rounded-full text-neige motion-safe:transition hover:bg-stratosphere-haute disabled:cursor-not-allowed disabled:text-trait disabled:hover:bg-transparent ${focusRing}`;

// Sélecteur de quantité « − 2 + », borné entre min et max
function QuantityStepper({ value, min = 1, max, onChange, label, disabled = false }) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-full border border-contour">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`Diminuer : ${label}`}
        className={buttonClass}
      >
        <Minus aria-hidden="true" strokeWidth={1.5} className="size-4" />
      </button>
      <output aria-live="polite" className="w-8 text-center font-bold">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Augmenter : ${label}`}
        className={buttonClass}
      >
        <Plus aria-hidden="true" strokeWidth={1.5} className="size-4" />
      </button>
    </div>
  );
}

export default QuantityStepper;
