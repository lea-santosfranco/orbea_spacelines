import { formatDate, formatPrice, formatSeats, TRAVEL_CLASS_LABELS } from '../../utils/format.js';

const focusRing = 'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-aube';

// Regroupe les variantes par date de départ : { '2027-03-14': [Économie, Affaires, Première], ... }
function groupByDate(variants) {
  const groups = new Map();
  for (const variant of variants) {
    if (!groups.has(variant.departureDate)) groups.set(variant.departureDate, []);
    groups.get(variant.departureDate).push(variant);
  }
  return [...groups.entries()];
}

// Choix du départ (date + classe). Les départs complets sont affichés mais désactivés.
function TripDepartures({ variants, selectedId, onSelect }) {
  if (variants.length === 0) {
    return <p className="mt-4 text-brume">Aucun départ n'est programmé pour le moment.</p>;
  }

  return (
    <fieldset className="mt-4 flex flex-col gap-6">
      <legend className="sr-only">Choisissez votre date de départ et votre classe</legend>

      {groupByDate(variants).map(([date, dateVariants]) => (
        <div key={date}>
          <p className="font-bold">Départ le {formatDate(date)}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {dateVariants.map((variant) => {
              const soldOut = variant.stock === 0;
              const selected = variant.id === selectedId;

              return (
                <label
                  key={variant.id}
                  className={`relative flex flex-col gap-1 rounded-champ border p-4 motion-safe:transition ${focusRing} ${
                    soldOut
                      ? 'cursor-not-allowed border-trait opacity-50'
                      : selected
                        ? 'cursor-pointer border-aube bg-stratosphere-haute'
                        : 'cursor-pointer border-contour hover:bg-stratosphere-haute'
                  }`}
                >
                  <input
                    type="radio"
                    name="departure"
                    value={variant.id}
                    checked={selected}
                    disabled={soldOut}
                    onChange={() => onSelect(variant.id)}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-ciel">{TRAVEL_CLASS_LABELS[variant.travelClass]}</span>
                  <span className="text-lg font-bold">{formatPrice(variant.priceCents)}</span>
                  <span
                    className={`text-sm ${soldOut ? 'text-brume' : variant.stock <= 2 ? 'text-vigilance' : 'text-brume'}`}
                  >
                    {soldOut ? 'Complet' : formatSeats(variant.stock)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

export default TripDepartures;
