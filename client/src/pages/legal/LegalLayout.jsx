import { Link } from 'react-router';

// Mise en page commune aux pages légales : fil d'Ariane, titre, date de mise à jour et contenu
function LegalLayout({ title, updatedAt, children }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 lg:px-0 lg:py-16">
      <title>{`${title} · Orbea Spacelines`}</title>

      <nav aria-label="Fil d'Ariane" className="text-sm text-brume">
        <ol className="flex gap-2">
          <li>
            <Link to="/" className="hover:text-neige">
              Accueil
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-neige">
            {title}
          </li>
        </ol>
      </nav>

      <h1 className="mt-8 break-words font-display text-[32px] font-extrabold leading-[1.1] sm:text-[40px]">{title}</h1>
      <p className="mt-3 text-sm text-brume">Dernière mise à jour : {updatedAt}</p>

      <p className="mt-8 rounded-champ border border-vigilance/40 bg-stratosphere p-4 text-brume">
        Orbea Spacelines est une agence fictive créée dans le cadre d'un projet de formation. Aucun voyage ni
        article n'est réellement vendu et aucun paiement réel n'est effectué.
      </p>

      {/* Mise en forme des titres, paragraphes et listes du contenu */}
      <div className="mt-10 flex flex-col gap-4 text-brume [&_a]:text-ciel [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-neige [&_strong]:text-neige [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </article>
  );
}

export default LegalLayout;
