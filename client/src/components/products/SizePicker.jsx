const focusRing = 'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-aube';

// Choix de la taille d'un goodie. Les tailles épuisées restent visibles mais barrées et désactivées.
function SizePicker({ variants, selectedId, onSelect }) {
  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Choisissez votre taille</legend>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const soldOut = variant.stock === 0;
          const selected = variant.id === selectedId;

          return (
            <label
              key={variant.id}
              className={`flex h-12 min-w-14 items-center justify-center rounded-full border px-5 font-bold motion-safe:transition ${focusRing} ${
                soldOut
                  ? 'cursor-not-allowed border-trait text-brume line-through opacity-50'
                  : selected
                    ? 'cursor-pointer border-aube bg-aube text-abysse'
                    : 'cursor-pointer border-contour hover:bg-stratosphere-haute'
              }`}
            >
              <input
                type="radio"
                name="size"
                value={variant.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onSelect(variant.id)}
                className="sr-only"
              />
              {variant.size}
              {soldOut && <span className="sr-only"> (épuisé)</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default SizePicker;
