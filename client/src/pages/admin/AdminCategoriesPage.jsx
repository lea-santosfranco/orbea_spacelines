import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import {
  inputClass,
  primaryButton,
  smallButton,
  tableClass,
  tdClass,
  thClass,
} from '../../components/admin/adminStyles.js';
import { admin } from '../../services/api.js';

const TYPE_LABELS = { TRIP: 'Voyages', GOODIE: 'Goodies' };

function CategoryRow({ category, onSaved, onError }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  async function save() {
    try {
      await admin.updateCategory(category.id, { name });
      setEditing(false);
      onSaved();
    } catch (error) {
      onError(error.details?.[0]?.message ?? error.message);
    }
  }

  async function remove() {
    try {
      await admin.deleteCategory(category.id);
      onSaved();
    } catch (error) {
      onError(error.message);
    }
  }

  return (
    <tr>
      <td className={tdClass}>
        {editing ? (
          <input
            aria-label={`Nouveau nom de la catégorie ${category.name}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        ) : (
          <span className="font-bold">{category.name}</span>
        )}
      </td>
      <td className={`${tdClass} text-brume`}>{category.slug}</td>
      <td className={`${tdClass} text-right`}>{category.productCount}</td>
      <td className={tdClass}>
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <button type="button" onClick={save} className={smallButton}>
                <Check aria-hidden="true" strokeWidth={2} className="size-4" />
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(category.name);
                }}
                className={smallButton}
              >
                <X aria-hidden="true" strokeWidth={2} className="size-4" />
                Annuler
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} className={smallButton}>
                <Pencil aria-hidden="true" strokeWidth={1.5} className="size-4" />
                Renommer<span className="sr-only"> {category.name}</span>
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={category.productCount > 0}
                title={category.productCount > 0 ? 'Impossible : la catégorie contient des produits' : undefined}
                className={`${smallButton} disabled:cursor-not-allowed`}
              >
                <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
                Supprimer<span className="sr-only"> {category.name}</span>
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AdminCategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    admin
      .getCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((error) => {
        if (error.name !== 'AbortError') setMessage(error.message);
      });
    return () => controller.abort();
  }, [reloadCount]);

  const reload = () => {
    setMessage('');
    setReloadCount((count) => count + 1);
  };

  async function handleCreate(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    try {
      await admin.createCategory(Object.fromEntries(new FormData(formElement)));
      formElement.reset();
      reload();
    } catch (error) {
      setMessage(error.details?.[0]?.message ?? error.message);
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <title>Catégories · Administration Orbea</title>
      <AdminPageHeader title="Catégories" subtitle="Organisation du catalogue et de la boutique" />

      <form
        onSubmit={handleCreate}
        className="mt-8 flex flex-wrap items-end gap-4 rounded-carte border border-trait p-6"
      >
        <div className="min-w-60 flex-1">
          <label htmlFor="nouvelle-categorie" className="text-sm font-bold">
            Nouvelle catégorie
          </label>
          <input id="nouvelle-categorie" name="name" required minLength={2} className={`${inputClass} mt-2`} />
        </div>
        <div>
          <label htmlFor="type-categorie" className="text-sm font-bold">
            Type
          </label>
          <select id="type-categorie" name="productType" className={`${inputClass} mt-2`}>
            <option value="TRIP">Voyages</option>
            <option value="GOODIE">Goodies</option>
          </select>
        </div>
        <button type="submit" className={primaryButton}>
          <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
          Ajouter
        </button>
      </form>

      {message && (
        <p role="alert" className="mt-4 text-sm text-erreur">
          {message}
        </p>
      )}

      {!categories && (
        <p role="status" className="mt-8 text-brume">
          Chargement…
        </p>
      )}

      {categories &&
        Object.entries(TYPE_LABELS).map(([type, label]) => (
          <section key={type} className="mt-8">
            <h2 className="font-display text-[22px] font-bold">{label}</h2>
            <div className="mt-4 overflow-x-auto rounded-carte border border-trait">
              <table className={tableClass}>
                <thead className="border-b border-trait">
                  <tr>
                    <th scope="col" className={thClass}>
                      Nom
                    </th>
                    <th scope="col" className={thClass}>
                      Slug (URL)
                    </th>
                    <th scope="col" className={`${thClass} text-right`}>
                      Produits
                    </th>
                    <th scope="col" className={thClass}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trait">
                  {categories
                    .filter((category) => category.productType === type)
                    .map((category) => (
                      <CategoryRow key={category.id} category={category} onSaved={reload} onError={setMessage} />
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
    </div>
  );
}

export default AdminCategoriesPage;
