import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SlidersHorizontal } from 'lucide-react';
import ProductCard from '../../components/products/ProductCard.jsx';
import CatalogFilters from '../../components/catalog/CatalogFilters.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { getCategories, getProducts } from '../../services/api.js';
import { SORT_OPTIONS } from '../../utils/catalog.js';

const PAGE_SIZE = 9;

// Textes propres à chaque catalogue : destinations (voyages) ou boutique (goodies)
const CATALOGS = {
  TRIP: {
    title: 'Destinations',
    eyebrow: 'Catalogue',
    intro: "De l'orbite basse jusqu'à Mars, choisissez le voyage qui vous ressemble.",
    searchLabel: 'Rechercher une destination',
    availableLabel: 'Masquer les voyages complets',
    noun: { one: 'destination', many: 'destinations' },
  },
  GOODIE: {
    title: 'Boutique',
    eyebrow: 'Souvenirs',
    intro: "Vêtements, accessoires et objets de collection aux couleurs d'Orbéa.",
    searchLabel: 'Rechercher un article',
    availableLabel: 'Masquer les articles épuisés',
    noun: { one: 'article', many: 'articles' },
  },
};

// Lit les filtres dans l'URL en ignorant les valeurs incorrectes
function readFilters(searchParams) {
  const sort = searchParams.get('sort');
  const page = Number(searchParams.get('page'));

  return {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'default',
    available: searchParams.get('available') === 'true',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function CatalogPage({ type }) {
  const catalog = CATALOGS[type];
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const { q, category, sort, available, page } = filters;

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ key: null, data: null, error: false });
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Clé de la requête en cours : tant que la réponse reçue ne correspond pas à cette clé, on est en chargement
  const requestKey = searchParams.toString();

  // Catégories : chargées une seule fois
  useEffect(() => {
    const controller = new AbortController();
    getCategories({ type }, { signal: controller.signal })
      .then(setCategories)
      .catch(() => {}); // Sans catégories, le reste du catalogue reste utilisable
    return () => controller.abort();
  }, [type]);

  // Produits : rechargés à chaque changement de filtre ou de page
  useEffect(() => {
    const controller = new AbortController();

    getProducts(
      { type, q, category, sort: sort === 'default' ? '' : sort, available: available ? 'true' : '', page, limit: PAGE_SIZE },
      { signal: controller.signal },
    )
      .then((data) => setResult({ key: requestKey, data, error: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: null, error: true });
      });

    return () => controller.abort();
  }, [requestKey, type, q, category, sort, available, page]);

  const status = result.key !== requestKey ? 'loading' : result.error ? 'error' : 'success';
  // Pendant un rechargement, on garde l'ancienne liste affichée (atténuée) plutôt qu'un écran vide
  const state = { status, data: result.data };

  // Remonte en haut de la page quand on change de page
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  // Met à jour l'URL ; tout changement de filtre ramène à la page 1
  function updateFilters(changes) {
    const next = { ...filters, ...changes, page: 1 };
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.category) params.set('category', next.category);
    if (next.sort !== 'default') params.set('sort', next.sort);
    if (next.available) params.set('available', 'true');
    setSearchParams(params);
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

  const total = state.data?.total ?? 0;
  const countLabel = `${total} ${total > 1 ? catalog.noun.many : catalog.noun.one}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-16 lg:py-16">
      <title>{`${catalog.title} · Orbea Spacelines`}</title>

      <nav aria-label="Fil d'Ariane" className="text-sm text-brume">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:text-neige">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-neige">
            {catalog.title}
          </li>
        </ol>
      </nav>

      <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-ciel">{catalog.eyebrow}</p>
      <h1 className="mt-2 break-words font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">{catalog.title}</h1>
      <p className="mt-4 max-w-xl text-lg text-brume">{catalog.intro}</p>

      <div className="mt-10 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
        <aside aria-label="Filtres">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="filtres-catalogue"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-contour px-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube lg:hidden"
          >
            <SlidersHorizontal aria-hidden="true" strokeWidth={1.5} className="size-4" />
            Filtres et tri
          </button>
          <div id="filtres-catalogue" className={`${filtersOpen ? 'block' : 'hidden'} mt-6 lg:mt-0 lg:block`}>
            <CatalogFilters
              filters={filters}
              categories={categories}
              onChange={updateFilters}
              onReset={resetFilters}
              searchLabel={catalog.searchLabel}
              availableLabel={catalog.availableLabel}
            />
          </div>
        </aside>

        <div className="mt-8 lg:mt-0">
          {/* Annonce le nombre de résultats aux lecteurs d'écran à chaque changement */}
          <p aria-live="polite" className="text-brume">
            {state.status === 'success' && countLabel}
            {state.status === 'success' && q && ` pour « ${q} »`}
          </p>

          {state.status === 'loading' && !state.data && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Chargement du catalogue">
              {[1, 2, 3, 4, 5, 6].map((key) => (
                <div key={key} className="h-96 rounded-carte bg-stratosphere motion-safe:animate-pulse" />
              ))}
            </div>
          )}

          {state.status === 'error' && (
            <p role="alert" className="mt-6 rounded-carte bg-stratosphere p-6 text-brume">
              Le catalogue n'a pas pu être chargé. Réessayez dans quelques instants.
            </p>
          )}

          {state.data && state.status !== 'error' && total === 0 && (
            <div className="mt-6 rounded-carte border border-trait p-8 text-center">
              <p className="font-display text-[22px] font-bold">Aucun résultat</p>
              <p className="mt-2 text-brume">Aucun produit ne correspond à votre recherche. Essayez d'autres filtres.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex h-12 items-center rounded-full bg-aube px-6 font-bold text-abysse hover:bg-aube-survol focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube"
              >
                Voir tout le catalogue
              </button>
            </div>
          )}

          {state.data && state.status !== 'error' && total > 0 && (
            <>
              <ul
                aria-busy={state.status === 'loading'}
                className={`mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 motion-safe:transition-opacity ${
                  state.status === 'loading' ? 'opacity-50' : ''
                }`}
              >
                {state.data.items.map((product) => (
                  <li key={product.id} className="flex">
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
              <Pagination page={state.data.page} totalPages={state.data.totalPages} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default CatalogPage;
