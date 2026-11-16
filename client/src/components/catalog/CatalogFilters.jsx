import { useId } from 'react';
import { Search } from 'lucide-react';
import { SORT_OPTIONS } from '../../utils/catalog.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const fieldClass = `h-11 w-full rounded-champ border border-contour bg-stratosphere-haute px-4 text-sm text-neige ${focusRing}`;
const labelClass = 'text-xs font-bold uppercase tracking-[0.18em] text-ciel';

// Panneau de filtres du catalogue. Les valeurs viennent de l'URL et chaque changement la met à jour.
function CatalogFilters({ filters, categories, onChange, onReset, searchLabel, availableLabel }) {
  const id = useId();

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
          {SORT_OPTIONS.map((option) => (
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
