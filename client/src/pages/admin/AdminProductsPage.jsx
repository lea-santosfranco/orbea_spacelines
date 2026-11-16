import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Archive, ArchiveRestore, Pencil, Plus, Search } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import {
  inputClass,
  primaryButton,
  smallButton,
  focusRing,
  tableClass,
  tdClass,
  thClass,
} from '../../components/admin/adminStyles.js';
import Pagination from '../../components/ui/Pagination.jsx';
import ProductImage from '../../components/ui/ProductImage.jsx';
import { admin } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

const TABS = [
  { key: 'TRIP', label: 'Voyages' },
  { key: 'GOODIE', label: 'Goodies' },
  { key: 'ARCHIVED', label: 'Archivés' },
];

function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get('onglet')) ? searchParams.get('onglet') : 'TRIP';
  const q = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const requestKey = searchParams.toString();

  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [reloadCount, setReloadCount] = useState(0);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = tab === 'ARCHIVED' ? { archived: 'true', q, page } : { type: tab, q, page };
    admin
      .getProducts(params, { signal: controller.signal })
      .then((data) => setResult({ key: requestKey, data, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: null, error: error.message });
      });
    return () => controller.abort();
  }, [tab, q, page, requestKey, reloadCount]);

  function changeTab(key) {
    setSearchParams(key === 'TRIP' ? {} : { onglet: key });
  }

  function handleSearch(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('q').trim();
    const params = new URLSearchParams();
    if (tab !== 'TRIP') params.set('onglet', tab);
    if (value) params.set('q', value);
    setSearchParams(params);
  }

  async function toggleArchive(product) {
    setActionError('');
    try {
      await admin.setArchived(product.id, !product.isArchived);
      setReloadCount((count) => count + 1);
    } catch (error) {
      setActionError(error.message);
    }
  }

  const isLoading = result.key !== requestKey;
  const products = result.data?.items ?? [];

  return (
    <div className="p-6 lg:p-10">
      <title>Produits · Administration Orbea</title>
      <AdminPageHeader title="Produits" subtitle="Voyages et goodies du catalogue">
        <Link to="/admin/produits/nouveau?type=TRIP" className={primaryButton}>
          <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
          Nouveau voyage
        </Link>
        <Link to="/admin/produits/nouveau?type=GOODIE" className={primaryButton}>
          <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
          Nouveau goodie
        </Link>
      </AdminPageHeader>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Type de produits" className="flex gap-1 rounded-full bg-stratosphere p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => changeTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${focusRing} ${
                tab === t.key ? 'bg-stratosphere-haute text-neige' : 'text-brume hover:text-neige'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form role="search" onSubmit={handleSearch} key={requestKey} className="relative w-full max-w-xs">
          <label htmlFor="recherche-produit" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="recherche-produit"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher un produit"
            className={`${inputClass} pl-10`}
          />
          <Search
            aria-hidden="true"
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brume"
          />
        </form>
      </div>

      {actionError && (
        <p role="alert" className="mt-4 text-sm text-erreur">
          {actionError}
        </p>
      )}

      {isLoading && (
        <p role="status" className="mt-8 text-brume">
          Chargement…
        </p>
      )}
      {!isLoading && result.error && (
        <p role="alert" className="mt-8 text-erreur">
          {result.error}
        </p>
      )}
      {!isLoading && !result.error && products.length === 0 && <p className="mt-8 text-brume">Aucun produit.</p>}

      {!isLoading && products.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-carte border border-trait">
            <table className={tableClass}>
              <thead className="border-b border-trait">
                <tr>
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Image</span>
                  </th>
                  <th scope="col" className={thClass}>
                    Nom
                  </th>
                  <th scope="col" className={thClass}>
                    Catégorie
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Prix dès
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    {tab === 'GOODIE' ? 'Tailles' : 'Variantes'}
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    {tab === 'GOODIE' ? 'Stock' : 'Places / stock'}
                  </th>
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trait">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className={tdClass}>
                      <ProductImage image={product.image} className="size-12 rounded-champ" />
                    </td>
                    <td className={`${tdClass} font-bold`}>
                      {product.name}
                      {tab === 'ARCHIVED' && (
                        <span className="ml-2 font-normal text-brume">
                          ({product.type === 'TRIP' ? 'voyage' : 'goodie'})
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-brume`}>{product.category}</td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      {product.minPriceCents !== null ? formatPrice(product.minPriceCents) : '—'}
                    </td>
                    <td className={`${tdClass} text-right`}>{product.variantCount}</td>
                    <td className={`${tdClass} text-right ${product.totalStock === 0 ? 'font-bold text-erreur' : ''}`}>
                      {product.totalStock}
                    </td>
                    <td className={tdClass}>
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/produits/${product.id}`} className={smallButton}>
                          <Pencil aria-hidden="true" strokeWidth={1.5} className="size-4" />
                          Modifier<span className="sr-only"> {product.name}</span>
                        </Link>
                        <button type="button" onClick={() => toggleArchive(product)} className={smallButton}>
                          {product.isArchived ? (
                            <ArchiveRestore aria-hidden="true" strokeWidth={1.5} className="size-4" />
                          ) : (
                            <Archive aria-hidden="true" strokeWidth={1.5} className="size-4" />
                          )}
                          {product.isArchived ? 'Restaurer' : 'Archiver'}
                          <span className="sr-only"> {product.name}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={result.data.page} totalPages={result.data.totalPages} />
        </>
      )}
    </div>
  );
}

export default AdminProductsPage;
