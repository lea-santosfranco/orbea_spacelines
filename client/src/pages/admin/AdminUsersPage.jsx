import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { inputClass, smallButton, tableClass, tdClass, thClass } from '../../components/admin/adminStyles.js';
import Pagination from '../../components/ui/Pagination.jsx';
import { useAuth } from '../../context/useAuth.js';
import { admin } from '../../services/api.js';
import { formatDateTime } from '../../utils/orders.js';

function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = ['active', 'inactive'].includes(searchParams.get('statut')) ? searchParams.get('statut') : '';
  const q = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const requestKey = searchParams.toString();
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [reloadCount, setReloadCount] = useState(0);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    admin
      .getUsers({ status, q, page }, { signal: controller.signal })
      .then((data) => setResult({ key: requestKey, data, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: null, error: error.message });
      });
    return () => controller.abort();
  }, [status, q, page, requestKey, reloadCount]);

  function updateFilters(changes) {
    const next = { statut: status, q, ...changes };
    const params = new URLSearchParams();
    if (next.statut) params.set('statut', next.statut);
    if (next.q) params.set('q', next.q);
    setSearchParams(params);
  }

  async function toggle(user) {
    setActionError('');
    try {
      await admin.setUserActive(user.id, !user.isActive);
      setReloadCount((count) => count + 1);
    } catch (error) {
      setActionError(error.message);
    }
  }

  const isLoading = result.key !== requestKey;
  const users = result.data?.items ?? [];

  return (
    <div className="p-6 lg:p-10">
      <title>Utilisateurs · Administration Orbea</title>
      <AdminPageHeader
        title="Utilisateurs"
        subtitle="Un compte désactivé ne peut plus se connecter ; ses commandes restent consultables."
      />

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filtre-utilisateurs" className="text-sm font-bold">
            Statut
          </label>
          <select
            id="filtre-utilisateurs"
            value={status}
            onChange={(event) => updateFilters({ statut: event.target.value })}
            className={`${inputClass} mt-2 w-48`}
          >
            <option value="">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Désactivés</option>
          </select>
        </div>
        <form
          role="search"
          key={requestKey}
          onSubmit={(event) => {
            event.preventDefault();
            updateFilters({ q: new FormData(event.currentTarget).get('q').trim() });
          }}
          className="relative w-full max-w-xs"
        >
          <label htmlFor="recherche-utilisateur" className="sr-only">
            Rechercher par nom ou e-mail
          </label>
          <input
            id="recherche-utilisateur"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Nom ou e-mail"
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
      {!isLoading && !result.error && users.length === 0 && <p className="mt-8 text-brume">Aucun utilisateur.</p>}

      {!isLoading && users.length > 0 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-carte border border-trait">
            <table className={tableClass}>
              <thead className="border-b border-trait">
                <tr>
                  <th scope="col" className={thClass}>
                    Nom
                  </th>
                  <th scope="col" className={thClass}>
                    E-mail
                  </th>
                  <th scope="col" className={thClass}>
                    Inscription
                  </th>
                  <th scope="col" className={thClass}>
                    Rôle
                  </th>
                  <th scope="col" className={`${thClass} text-right`}>
                    Commandes
                  </th>
                  <th scope="col" className={thClass}>
                    Statut
                  </th>
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trait">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className={`${tdClass} font-bold`}>
                      {user.firstName} {user.lastName}
                    </td>
                    <td className={`${tdClass} text-brume`}>{user.email}</td>
                    <td className={`${tdClass} whitespace-nowrap text-brume`}>{formatDateTime(user.createdAt)}</td>
                    <td className={tdClass}>{user.role === 'ADMIN' ? 'Admin' : 'Client'}</td>
                    <td className={`${tdClass} text-right`}>{user.orderCount}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          user.isActive ? 'border-succes/50 text-succes' : 'border-erreur/50 text-erreur'
                        }`}
                      >
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      {user.role !== 'ADMIN' && user.id !== currentUser.id && (
                        <button type="button" onClick={() => toggle(user)} className={smallButton}>
                          {user.isActive ? 'Désactiver' : 'Réactiver'}
                          <span className="sr-only">
                            {' '}
                            {user.firstName} {user.lastName}
                          </span>
                        </button>
                      )}
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

export default AdminUsersPage;
