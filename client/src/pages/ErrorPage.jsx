import { Link, useRouteError } from 'react-router';

// Affichée si une page plante : message générique, détail seulement dans la console
function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <title>Erreur · Orbea Spacelines</title>
      <h1 className="font-display text-4xl font-extrabold">Une erreur est survenue</h1>
      <p className="mt-4 text-lg text-brume">Réessayez dans quelques instants ou revenez à l'accueil.</p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-aube px-6 text-[15px] font-bold text-abysse hover:bg-aube-survol focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube"
      >
        Retourner à l'accueil
      </Link>
    </main>
  );
}

export default ErrorPage;