import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import FormField from '../../components/ui/FormField.jsx';
import { useAuth } from '../../context/useAuth.js';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const submitClass = `mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-aube px-6 font-bold text-abysse motion-safe:transition hover:bg-aube-survol disabled:cursor-wait disabled:opacity-60 ${focusRing}`;

// N'accepte que des chemins internes au site, pour éviter une redirection vers un site malveillant
function safeRedirect(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/compte';
}

// Transforme les erreurs de validation de l'API en { champ: message } (premier message de chaque champ)
function fieldErrors(error) {
  const errors = {};
  for (const detail of error.details ?? []) {
    if (!errors[detail.field]) errors[detail.field] = detail.message;
  }
  return errors;
}

function FormAlert({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-champ border border-erreur/50 bg-stratosphere p-4 text-sm text-erreur">
      {message}
    </p>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setErrors({});
    setMessage('');

    try {
      // Une fois l'utilisateur enregistré dans le contexte, la page redirige d'elle-même
      await login({ email: form.get('email'), password: form.get('password') });
    } catch (error) {
      setErrors(fieldErrors(error));
      if (!error.details) setMessage(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={message} />
      <FormField label="Adresse e-mail" name="email" type="email" autoComplete="email" required error={errors.email} />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <button type="submit" disabled={isSubmitting} className={submitClass}>
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setErrors({});
    setMessage('');

    try {
      await register({
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        email: form.get('email'),
        password: form.get('password'),
        consent: form.get('consent') === 'on',
      });
    } catch (error) {
      if (error.status === 409) {
        setErrors({ email: error.message }); // Adresse déjà utilisée
      } else {
        setErrors(fieldErrors(error));
        if (!error.details) setMessage(error.message);
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormAlert message={message} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Prénom" name="firstName" autoComplete="given-name" required error={errors.firstName} />
        <FormField label="Nom" name="lastName" autoComplete="family-name" required error={errors.lastName} />
      </div>
      <FormField label="Adresse e-mail" name="email" type="email" autoComplete="email" required error={errors.email} />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Au moins 12 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial."
        error={errors.password}
      />

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-brume">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'erreur-consentement' : undefined}
            className={`mt-0.5 size-4 shrink-0 accent-aube ${focusRing}`}
          />
          <span>
            J'accepte que mes données soient utilisées pour gérer mon compte et mes commandes, conformément à la{' '}
            <Link to="/confidentialite" className="text-ciel underline">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="erreur-consentement" className="mt-2 text-sm text-erreur">
            {errors.consent}
          </p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className={submitClass}>
        {isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
      </button>
    </form>
  );
}

function LoginPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));

  // Connecté (déjà, ou juste après la connexion / l'inscription) : on part vers la page demandée
  if (user) return <Navigate to={redirect} replace />;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-16 lg:py-16">
      <title>Connexion · Orbea Spacelines</title>
      <h1 className="font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">Votre compte Orbéa</h1>
      <p className="mt-4 max-w-xl text-lg text-brume">
        Connectez-vous ou créez un compte pour réserver vos voyages et suivre vos commandes.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="titre-connexion" className="rounded-carte bg-stratosphere p-6 lg:self-start lg:p-8">
          <h2 id="titre-connexion" className="font-display text-[22px] font-bold">
            J'ai déjà un compte
          </h2>
          <div className="mt-6">
            <LoginForm />
          </div>
        </section>

        <section aria-labelledby="titre-inscription" className="rounded-carte border border-trait p-6 lg:p-8">
          <h2 id="titre-inscription" className="font-display text-[22px] font-bold">
            Je crée mon compte
          </h2>
          <div className="mt-6">
            <RegisterForm />
          </div>
        </section>
      </div>
    </section>
  );
}

export default LoginPage;
