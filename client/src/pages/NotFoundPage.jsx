import { Link } from 'react-router';

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center lg:px-16">
      <title>Page introuvable · Orbea Spacelines</title>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">Erreur 404</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Cette page s'est perdue dans l'espace</h1>
      <p className="mt-4 text-lg text-brume">
        L'adresse demandée n'existe pas ou n'est plus disponible.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-aube px-6 text-[15px] font-bold text-abysse motion-safe:transition hover:bg-aube-survol hover:shadow-lueur-aube focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube"
      >
        Retourner à l'accueil
      </Link>
    </section>
  );
}

export default NotFoundPage;