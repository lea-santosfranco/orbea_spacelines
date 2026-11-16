import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, CheckCircle2, ImagePlus, Plus, Star, Trash2 } from 'lucide-react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import {
  focusRing,
  inputClass,
  primaryButton,
  secondaryButton,
  smallButton,
  tableClass,
  tdClass,
  thClass,
} from '../../components/admin/adminStyles.js';
import ProductImage from '../../components/ui/ProductImage.jsx';
import { admin } from '../../services/api.js';
import { TRAVEL_CLASS_LABELS } from '../../utils/format.js';

let nextKey = 1;
const newKey = () => `nouvelle-${nextKey++}`;

// Les prix sont saisis en euros mais stockés en centimes
const toEuros = (cents) => (cents / 100).toString();
const toCents = (euros) => Math.round(Number(String(euros).replace(',', '.')) * 100);

function emptyVariant(type) {
  return type === 'TRIP'
    ? { key: newKey(), departureDate: '', travelClass: 'ECONOMY', price: '', stock: '', isActive: true }
    : { key: newKey(), size: '', price: '', stock: '', isActive: true };
}

function fromApi(product) {
  return {
    type: product.type,
    name: product.name,
    categoryId: String(product.categoryId),
    description: product.description,
    durationDays: product.durationDays ?? '',
    variants: product.variants.map((variant) => ({
      key: `v${variant.id}`,
      id: variant.id,
      departureDate: variant.departureDate ?? '',
      travelClass: variant.travelClass ?? 'ECONOMY',
      size: variant.size ?? '',
      price: toEuros(variant.priceCents),
      stock: String(variant.stock),
      isActive: variant.isActive,
    })),
  };
}

function toApi(form) {
  return {
    ...(form.type && { type: form.type }),
    name: form.name,
    categoryId: Number(form.categoryId),
    description: form.description,
    durationDays: form.type === 'TRIP' ? Number(form.durationDays) || null : null,
    variants: form.variants.map((variant) => ({
      ...(variant.id && { id: variant.id }),
      ...(form.type === 'TRIP'
        ? { departureDate: variant.departureDate, travelClass: variant.travelClass }
        : { size: variant.size.trim() }),
      priceCents: toCents(variant.price),
      stock: Number(variant.stock),
      isActive: variant.isActive,
    })),
  };
}

function Field({ label, children, className = '' }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <div className="mt-2">{children(id)}</div>
    </div>
  );
}

function VariantsEditor({ type, variants, onChange }) {
  const isTrip = type === 'TRIP';

  function update(key, changes) {
    onChange(variants.map((variant) => (variant.key === key ? { ...variant, ...changes } : variant)));
  }

  return (
    <fieldset className="rounded-carte border border-trait p-6">
      <legend className="px-2 font-display text-[22px] font-bold">{isTrip ? 'Départs' : 'Tailles et stock'}</legend>
      <p className="text-sm text-brume">
        {isTrip
          ? 'Une ligne par date et par classe. Retirer une ligne la désactive : elle reste liée aux commandes passées.'
          : 'Une ligne par taille (« Unique » pour un article sans taille).'}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr>
              {isTrip ? (
                <>
                  <th scope="col" className={thClass}>
                    Date de départ
                  </th>
                  <th scope="col" className={thClass}>
                    Classe
                  </th>
                </>
              ) : (
                <th scope="col" className={thClass}>
                  Taille
                </th>
              )}
              <th scope="col" className={thClass}>
                Prix (€)
              </th>
              <th scope="col" className={thClass}>
                {isTrip ? 'Places' : 'Stock'}
              </th>
              <th scope="col" className={thClass}>
                En vente
              </th>
              <th scope="col" className={thClass}>
                <span className="sr-only">Retirer</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => {
              const label = `ligne ${index + 1}`;
              return (
                <tr key={variant.key} className={variant.isActive ? '' : 'opacity-60'}>
                  {isTrip ? (
                    <>
                      <td className={tdClass}>
                        <input
                          type="date"
                          aria-label={`Date de départ, ${label}`}
                          value={variant.departureDate}
                          onChange={(event) => update(variant.key, { departureDate: event.target.value })}
                          className={inputClass}
                        />
                      </td>
                      <td className={tdClass}>
                        <select
                          aria-label={`Classe, ${label}`}
                          value={variant.travelClass}
                          onChange={(event) => update(variant.key, { travelClass: event.target.value })}
                          className={inputClass}
                        >
                          {Object.entries(TRAVEL_CLASS_LABELS).map(([value, text]) => (
                            <option key={value} value={value}>
                              {text}
                            </option>
                          ))}
                        </select>
                      </td>
                    </>
                  ) : (
                    <td className={tdClass}>
                      <input
                        aria-label={`Taille, ${label}`}
                        value={variant.size}
                        onChange={(event) => update(variant.key, { size: event.target.value })}
                        className={`${inputClass} w-28`}
                      />
                    </td>
                  )}
                  <td className={tdClass}>
                    <input
                      inputMode="decimal"
                      aria-label={`Prix en euros, ${label}`}
                      value={variant.price}
                      onChange={(event) => update(variant.key, { price: event.target.value })}
                      className={`${inputClass} w-32`}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="number"
                      min="0"
                      aria-label={`${isTrip ? 'Places' : 'Stock'}, ${label}`}
                      value={variant.stock}
                      onChange={(event) => update(variant.key, { stock: event.target.value })}
                      className={`${inputClass} w-24`}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      type="checkbox"
                      aria-label={`En vente, ${label}`}
                      checked={variant.isActive}
                      onChange={(event) => update(variant.key, { isActive: event.target.checked })}
                      className={`size-4 accent-aube ${focusRing}`}
                    />
                  </td>
                  <td className={tdClass}>
                    <button
                      type="button"
                      onClick={() => onChange(variants.filter((item) => item.key !== variant.key))}
                      aria-label={`Retirer la ${label}`}
                      className={`${smallButton} border-transparent text-brume`}
                    >
                      <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => onChange([...variants, emptyVariant(type)])}
        className={`mt-4 ${smallButton}`}
      >
        <Plus aria-hidden="true" strokeWidth={2} className="size-4" />
        {isTrip ? 'Ajouter un départ' : 'Ajouter une taille'}
      </button>
    </fieldset>
  );
}

function ImagesEditor({ product, onProductChange }) {
  const [state, setState] = useState({ pending: false, error: '' });

  async function run(action) {
    setState({ pending: true, error: '' });
    try {
      onProductChange(await action());
      setState({ pending: false, error: '' });
      return true;
    } catch (error) {
      setState({ pending: false, error: error.message });
      return false;
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const ok = await run(() => admin.uploadImage(product.id, new FormData(formElement)));
    if (ok) formElement.reset();
  }

  return (
    <section aria-labelledby="titre-images" className="rounded-carte border border-trait p-6">
      <h2 id="titre-images" className="font-display text-[22px] font-bold">
        Images
      </h2>
      <p className="mt-1 text-sm text-brume">La première image est utilisée sur les cartes du catalogue.</p>

      {product.images.length === 0 ? (
        <p className="mt-4 text-brume">Aucune image pour le moment.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {product.images.map((image, index) => (
            <li key={image.id} className="overflow-hidden rounded-champ border border-trait">
              <ProductImage image={image} className="aspect-[4/3] w-full" />
              <div className="p-3">
                <p className="text-sm text-brume">{image.altText}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-aube">
                      <Star aria-hidden="true" strokeWidth={1.5} className="size-4 fill-aube" />
                      Image principale
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={state.pending}
                      onClick={() => run(() => admin.setMainImage(product.id, image.id))}
                      className={smallButton}
                    >
                      <Star aria-hidden="true" strokeWidth={1.5} className="size-4" />
                      Principale
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={state.pending}
                    onClick={() => run(() => admin.deleteImage(product.id, image.id))}
                    className={smallButton}
                  >
                    <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
                    Supprimer<span className="sr-only"> l'image {image.altText}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleUpload} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Fichier (JPEG, PNG ou WebP, 2 Mo max)">
          {(id) => (
            <input
              id={id}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className={`${inputClass} py-2 file:mr-3 file:rounded-full file:border-0 file:bg-stratosphere file:px-3 file:py-1 file:text-neige`}
            />
          )}
        </Field>
        <Field label="Texte alternatif (décrit l'image)">
          {(id) => <input id={id} name="altText" required minLength={3} maxLength={200} className={inputClass} />}
        </Field>
        <button type="submit" disabled={state.pending} className={primaryButton}>
          <ImagePlus aria-hidden="true" strokeWidth={1.5} className="size-4" />
          {state.pending ? 'Envoi…' : 'Ajouter'}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-erreur">
          {state.error}
        </p>
      )}
    </section>
  );
}

function ProductForm({ id }) {
  const isNew = id === 'nouveau';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const newType = searchParams.get('type') === 'GOODIE' ? 'GOODIE' : 'TRIP';
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(() =>
    isNew
      ? {
          type: newType,
          name: '',
          categoryId: '',
          description: '',
          durationDays: '',
          variants: [emptyVariant(newType)],
        }
      : null,
  );
  const [status, setStatus] = useState({ pending: false, errors: [], saved: false, loadError: '' });

  useEffect(() => {
    const controller = new AbortController();
    admin
      .getCategories({ signal: controller.signal })
      .then(setCategories)
      .catch(() => {});
    if (!isNew) {
      admin
        .getProduct(id, { signal: controller.signal })
        .then((data) => {
          setProduct(data);
          setForm(fromApi(data));
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setStatus((s) => ({ ...s, loadError: error.message }));
        });
    }
    return () => controller.abort();
  }, [id, isNew]);

  function updateForm(changes) {
    setForm((previous) => ({ ...previous, ...changes }));
    setStatus((s) => ({ ...s, saved: false }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ pending: true, errors: [], saved: false, loadError: '' });
    try {
      const payload = toApi(form);
      if (isNew) {
        const created = await admin.createProduct(payload);
        // Une fois créé, on passe sur la page du produit pour pouvoir ajouter les images
        navigate(`/admin/produits/${created.id}`, { replace: true });
        return;
      }
      // Le type n'est pas modifiable après la création : on ne l'envoie pas
      delete payload.type;
      const updated = await admin.updateProduct(id, payload);
      setProduct(updated);
      setForm(fromApi(updated));
      setStatus({ pending: false, errors: [], saved: true, loadError: '' });
    } catch (error) {
      const errors = error.details?.length ? error.details.map((detail) => detail.message) : [error.message];
      setStatus({ pending: false, errors: [...new Set(errors)], saved: false, loadError: '' });
    }
  }

  const backLink = (
    <Link to="/admin/produits" className="inline-flex items-center gap-2 text-sm font-bold text-ciel">
      <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="size-4" />
      Tous les produits
    </Link>
  );

  if (status.loadError) {
    return (
      <div className="p-6 lg:p-10">
        {backLink}
        <p role="alert" className="mt-6 text-erreur">
          {status.loadError}
        </p>
      </div>
    );
  }

  if (!form) {
    return (
      <p role="status" className="p-10 text-brume">
        Chargement…
      </p>
    );
  }

  const isTrip = form.type === 'TRIP';
  const typeCategories = categories.filter((category) => category.productType === form.type);
  const title = isNew ? (isTrip ? 'Nouveau voyage' : 'Nouveau goodie') : form.name || 'Produit';

  return (
    <div className="p-6 lg:p-10">
      <title>{`${title} · Administration Orbea`}</title>
      {backLink}
      <div className="mt-4">
        <AdminPageHeader title={title} subtitle={isTrip ? 'Voyage' : 'Goodie'}>
          {product && !product.isArchived && (
            <Link
              to={`${isTrip ? '/destinations' : '/boutique'}/${product.slug}`}
              target="_blank"
              className={secondaryButton}
            >
              Voir sur le site
            </Link>
          )}
        </AdminPageHeader>
      </div>
      {product?.isArchived && (
        <p className="mt-4 rounded-champ border border-vigilance/50 p-3 text-sm text-vigilance">
          Ce produit est archivé : il n'est plus visible sur le site.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-8">
        <section className="grid gap-5 rounded-carte border border-trait p-6 md:grid-cols-2">
          <Field label="Nom" className="md:col-span-2">
            {(fieldId) => (
              <input
                id={fieldId}
                value={form.name}
                onChange={(event) => updateForm({ name: event.target.value })}
                required
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Catégorie">
            {(fieldId) => (
              <select
                id={fieldId}
                value={form.categoryId}
                onChange={(event) => updateForm({ categoryId: event.target.value })}
                required
                className={inputClass}
              >
                <option value="">Choisir…</option>
                {typeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {isTrip && (
            <Field label="Durée (jours)">
              {(fieldId) => (
                <input
                  id={fieldId}
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={(event) => updateForm({ durationDays: event.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
          )}
          <Field label="Description" className="md:col-span-2">
            {(fieldId) => (
              <textarea
                id={fieldId}
                rows={5}
                value={form.description}
                onChange={(event) => updateForm({ description: event.target.value })}
                required
                className={`${inputClass} h-auto py-2`}
              />
            )}
          </Field>
        </section>

        <VariantsEditor type={form.type} variants={form.variants} onChange={(variants) => updateForm({ variants })} />

        <div aria-live="polite">
          {status.errors.length > 0 && (
            <ul role="alert" className="list-disc rounded-champ border border-erreur/50 p-4 pl-8 text-sm text-erreur">
              {status.errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
          {status.saved && (
            <p className="flex items-center gap-2 text-sm text-succes">
              <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
              Modifications enregistrées.
            </p>
          )}
        </div>

        <button type="submit" disabled={status.pending} className={`${primaryButton} self-start`}>
          {status.pending ? 'Enregistrement…' : isNew ? 'Créer le produit' : 'Enregistrer'}
        </button>
      </form>

      <div className="mt-10">
        {product ? (
          <ImagesEditor product={product} onProductChange={setProduct} />
        ) : (
          <p className="text-sm text-brume">Les images pourront être ajoutées une fois le produit créé.</p>
        )}
      </div>
    </div>
  );
}

// La clé recrée complètement le formulaire quand on change de produit (ou après une création)
function AdminProductFormPage() {
  const { id } = useParams();
  return <ProductForm key={id} id={id} />;
}

export default AdminProductFormPage;
