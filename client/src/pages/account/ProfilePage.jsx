import { useState } from 'react';
import { CheckCircle2, Download, Trash2 } from 'lucide-react';
import FormField from '../../components/ui/FormField.jsx';
import { useAuth } from '../../context/useAuth.js';
import { changePassword, deleteAccount, updateProfile } from '../../services/api.js';
import { fieldErrors } from '../../utils/formErrors.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const primaryButton = `inline-flex h-12 items-center justify-center gap-2 rounded-full bg-aube px-6 font-bold text-abysse motion-safe:transition hover:bg-aube-survol disabled:cursor-wait disabled:opacity-60 ${focusRing}`;
const cardClass = 'rounded-carte border border-trait p-6 lg:p-8';

// Gère l'état d'envoi d'un formulaire : erreurs par champ, message global, succès
function useFormStatus() {
  const [state, setState] = useState({ pending: false, errors: {}, message: '', success: '' });

  async function submit(action, successMessage) {
    setState({ pending: true, errors: {}, message: '', success: '' });
    try {
      await action();
      setState({ pending: false, errors: {}, message: '', success: successMessage });
      return true;
    } catch (error) {
      setState({
        pending: false,
        errors: fieldErrors(error),
        message: error.details ? '' : error.message,
        success: '',
      });
      return false;
    }
  }

  return [state, submit];
}

function StatusMessages({ state }) {
  return (
    <div aria-live="polite">
      {state.message && (
        <p role="alert" className="text-sm text-erreur">
          {state.message}
        </p>
      )}
      {state.success && (
        <p className="flex items-center gap-2 text-sm text-succes">
          <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="size-4" />
          {state.success}
        </p>
      )}
    </div>
  );
}

function ProfileForm() {
  const { user, updateUser } = useAuth();
  const [state, submit] = useFormStatus();

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(async () => {
      try {
        const data = await updateProfile(Object.fromEntries(form));
        updateUser(data.user);
      } catch (error) {
        // E-mail déjà utilisé (409) : on affiche l'erreur sous le champ concerné
        if (error.status === 409) error.details = [{ field: 'email', message: error.message }];
        throw error;
      }
    }, 'Vos informations ont été enregistrées.');
  }

  return (
    <section aria-labelledby="titre-infos" className={cardClass}>
      <h2 id="titre-infos" className="font-display text-[22px] font-bold">
        Informations personnelles
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Prénom"
            name="firstName"
            autoComplete="given-name"
            required
            defaultValue={user.firstName}
            error={state.errors.firstName}
          />
          <FormField
            label="Nom"
            name="lastName"
            autoComplete="family-name"
            required
            defaultValue={user.lastName}
            error={state.errors.lastName}
          />
        </div>
        <FormField
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={user.email}
          error={state.errors.email}
        />
        <FormField
          label="Adresse (facultatif)"
          name="address"
          autoComplete="street-address"
          defaultValue={user.address ?? ''}
          error={state.errors.address}
        />
        <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
          <FormField
            label="Code postal"
            name="postalCode"
            autoComplete="postal-code"
            inputMode="numeric"
            defaultValue={user.postalCode ?? ''}
            error={state.errors.postalCode}
          />
          <FormField
            label="Ville"
            name="city"
            autoComplete="address-level2"
            defaultValue={user.city ?? ''}
            error={state.errors.city}
          />
        </div>
        <StatusMessages state={state} />
        <button type="submit" disabled={state.pending} className={`${primaryButton} self-start`}>
          {state.pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const [state, submit] = useFormStatus();

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const ok = await submit(
      () => changePassword(Object.fromEntries(new FormData(formElement))),
      'Votre mot de passe a été modifié.',
    );
    if (ok) formElement.reset();
  }

  return (
    <section aria-labelledby="titre-mdp" className={cardClass}>
      <h2 id="titre-mdp" className="font-display text-[22px] font-bold">
        Mot de passe
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
        <FormField
          label="Mot de passe actuel"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          error={state.errors.currentPassword}
        />
        <FormField
          label="Nouveau mot de passe"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          hint="Au moins 12 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial."
          error={state.errors.newPassword}
        />
        <FormField
          label="Confirmer le nouveau mot de passe"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={state.errors.confirmPassword}
        />
        <StatusMessages state={state} />
        <button type="submit" disabled={state.pending} className={`${primaryButton} self-start`}>
          {state.pending ? 'Modification…' : 'Changer le mot de passe'}
        </button>
      </form>
    </section>
  );
}

function DataSection() {
  const [confirming, setConfirming] = useState(false);
  const [state, submit] = useFormStatus();

  async function handleDelete(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submit(() => deleteAccount({ password: form.get('password') }), '');
    if (ok) {
      // Rechargement complet vers l'accueil : toute l'application repart de zéro, sans session
      // (le serveur a déjà supprimé le cookie de connexion)
      window.location.replace('/');
    }
  }

  return (
    <section aria-labelledby="titre-donnees" className={cardClass}>
      <h2 id="titre-donnees" className="font-display text-[22px] font-bold">
        Mes données personnelles
      </h2>

      <h3 className="mt-6 font-bold">Télécharger mes données</h3>
      <p className="mt-2 text-sm text-brume">
        Recevez un fichier contenant votre profil, vos commandes et vos favoris (droit d'accès et de portabilité).
      </p>
      {/* Lien direct : le serveur répond avec un fichier à télécharger */}
      <a
        href="/api/account/export"
        download
        className={`mt-4 inline-flex h-12 items-center gap-2 rounded-full border border-contour px-6 font-bold hover:bg-stratosphere-haute ${focusRing}`}
      >
        <Download aria-hidden="true" strokeWidth={1.5} className="size-5" />
        Télécharger mes données (JSON)
      </a>

      <h3 className="mt-10 font-bold text-erreur">Supprimer mon compte</h3>
      <p className="mt-2 text-sm text-brume">
        Vos informations personnelles seront définitivement effacées et vous serez déconnecté. Vos commandes sont
        conservées de façon anonyme, car la loi impose de garder les factures pendant 10 ans.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`mt-4 inline-flex h-12 items-center gap-2 rounded-full border border-erreur/60 px-6 font-bold text-erreur hover:bg-erreur/10 ${focusRing}`}
        >
          <Trash2 aria-hidden="true" strokeWidth={1.5} className="size-5" />
          Supprimer mon compte
        </button>
      ) : (
        <form
          onSubmit={handleDelete}
          noValidate
          className="mt-4 flex flex-col gap-4 rounded-champ border border-erreur/50 p-5"
        >
          <p className="font-bold">Confirmez la suppression avec votre mot de passe. Cette action est irréversible.</p>
          <FormField
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={state.errors.password || state.message || undefined}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={state.pending}
              className={`inline-flex h-12 items-center rounded-full bg-erreur px-6 font-bold text-abysse disabled:opacity-60 ${focusRing}`}
            >
              {state.pending ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={`inline-flex h-12 items-center rounded-full border border-contour px-6 font-bold ${focusRing}`}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <title>Mon profil · Orbea Spacelines</title>
      <h1 className="font-display text-[32px] font-extrabold leading-[1.1]">Mon profil</h1>
      <ProfileForm />
      <PasswordForm />
      <DataSection />
    </div>
  );
}

export default ProfilePage;
