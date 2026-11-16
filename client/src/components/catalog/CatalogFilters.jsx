import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { sortOptionsFor } from '../../utils/catalog.js';
import { TRAVEL_CLASS_LABELS } from '../../utils/format.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const fieldClass = `h-11 w-full rounded-champ border border-contour bg-stratosphere-haute px-4 text-sm text-neige ${focusRing}`;
const labelClass = 'text-xs font-bold uppercase tracking-[0.18em] text-ciel';

// Prix et dates : saisis puis appliqués ensemble (bouton « Appliquer »), avec une vérification avant l'envoi
function RangeFilters({ filters, onChange, withDates }) {
  const id = useId();
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.minPrice && values.maxPrice && Number(values.minPrice) > Number(values.maxPrice)) {
      setError('Le prix minimum doit être inférieur au prix maximum.');
      return;
    }
    if (values.departureFrom && values.departureTo && values.departureFrom > values.departureTo) {
      setError('La date de début doit précéder la date de fin.');
      return;
    }
    setError('');
    onChange(values);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <fieldset>
        <legend className={labelClass}>Prix (€)</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${id}-min`} className="text-xs text-brume">
              Minimum
            </label>
            <input
              id={`${id}-min`}
              name="minPrice"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={filters.minPrice}
              className={`${fieldClass} mt-1 px-3`}
            />
          </div>
          <div>
            <label htmlFor={`${id}-max`} className="text-xs text-brume">
              Maximum
            </label>
            <input
              id={`${id}-max`}
              name="maxPrice"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={filters.maxPrice}
              className={`${fieldClass} mt-1 px-3`}
            />
          </div>
        </div>
      </fieldset>

      {withDates && (
        <fieldset>
          <legend className={labelClass}>Date de départ</legend>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <label htmlFor={`${id}-from`} className="text-xs text-brume">
                À partir du
              </label>
              <input
                id={`${id}-from`}
                name="departureFrom"
                type="date"
                defaultValue={filters.departureFrom}
                className={`${fieldClass} mt-1 px-3`}
              />
            </div>
            <div>
              <label htmlFor={`${id}-to`} className="text-xs text-brume">
                Jusqu'au
              </label>
              <input
                id={`${id}-to`}
                name="departureTo"
                type="date"
                defaultValue={filters.departureTo}
                className={`${fieldClass} mt-1 px-3`}
              />
            </div>
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-sm text-erreur">
          {error}
        </p>
      )}
      <button
        type="submit"
        className={`h-11 rounded-full border border-contour px-5 text-sm font-bold hover:bg-stratosphere-haute ${focusRing}`}
      >
        Appliquer
      </button>
    </form>
  );
}

// Panneau de filtres du catalogue. Les valeurs viennent de l'URL et chaque changement la met à jour.
function CatalogFilters({ filters, categories, onChange, onReset, searchLabel, availableLabel, type }) {
  const id = useId();
  const isTrip = type === 'TRIP';

  function handleSearch(event) {
    event.preventDefault();
    onChange({ q: new FormData(event.currentTarget).get('q').trim() });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* key : le champ se remet à jour si la recherche change ailleurs (ex. barre du header) */}
      <form role="search" onSubmit={handleSearch} key={filters.q}>
        <label htmlFor={`${id}-q`} className={labelClass}>
          Recherche
        </label>
        <div className="relative mt-3">
          <input
            id={`${id}-q`}
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder={searchLabel}
            className={`${fieldClass} pr-12`}
          />
          <button
            type="submit"
            aria-label="Lancer la recherche"
            className={`absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-brume hover:text-neige ${focusRing}`}
          >
            <Search aria-hidden="true" strokeWidth={1.5} className="size-4" />
          </button>
        </div>
      </form>

      <fieldset>
        <legend className={labelClass}>Catégorie</legend>
        <div className="mt-3 flex flex-col gap-2">
          {[{ slug: '', name: 'Toutes' }, ...categories].map((category) => (
            <label
              key={category.slug || 'all'}
              className="flex cursor-pointer items-center gap-3 text-brume has-checked:text-neige"
            >
              <input
                type="radio"
                name={`${id}-category`}
                value={category.slug}
                checked={filters.category === category.slug}
                onChange={() => onChange({ category: category.slug })}
                className={`size-4 accent-aube ${focusRing}`}
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      {isTrip && (
        <div>
          <label htmlFor={`${id}-class`} className={labelClass}>
            Classe
          </label>
          <select
            id={`${id}-class`}
            value={filters.travelClass}
            onChange={(event) => onChange({ travelClass: event.target.value })}
            className={`${fieldClass} mt-3`}
          >
            <option value="">Toutes les classes</option>
            {Object.entries(TRAVEL_CLASS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* key : le formulaire se remet à zéro quand les filtres sont réinitialisés */}
      <RangeFilters
        key={[filters.minPrice, filters.maxPrice, filters.departureFrom, filters.departureTo].join('|')}
        filters={filters}
        onChange={onChange}
        withDates={isTrip}
      />

      <div>
        <label htmlFor={`${id}-sort`} className={labelClass}>
          Trier par
        </label>
        <select
          id={`${id}-sort`}
          value={filters.sort}
          onChange={(event) => onChange({ sort: event.target.value })}
          className={`${fieldClass} mt-3`}
        >
          {sortOptionsFor(type).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-brume">
        <input
          type="checkbox"
          checked={filters.available}
          onChange={(event) => onChange({ available: event.target.checked })}
          className={`size-4 accent-aube ${focusRing}`}
        />
        {availableLabel}
      </label>

      <button
        type="button"
        onClick={onReset}
        className={`self-start rounded-full text-sm font-bold text-ciel underline-offset-4 hover:underline ${focusRing}`}
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}

export default CatalogFilters;
