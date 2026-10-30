import { useEffect, useState } from 'react';
import { Gem, Rocket, ShieldCheck } from 'lucide-react';
import ButtonLink from '../../components/ui/ButtonLink.jsx';
import ProductCard from '../../components/products/ProductCard.jsx';
import { getProducts } from '../../services/api.js';

const arguments_ = [
  {
    icon: Rocket,
    title: 'Des destinations uniques',
    text: "De l'orbite basse jusqu'à Mars, des voyages pensés pour vivre l'espace au plus près.",
  },
  {
    icon: ShieldCheck,
    title: 'Une sécurité sans compromis',
    text: 'Équipages expérimentés, vaisseaux certifiés et préparation complète avant chaque départ.',
  },
  {
    icon: Gem,
    title: 'Un voyage haut de gamme',
    text: 'Trois classes de voyage, du confort Économie à l’expérience Première.',
  },
];

function FeaturedDestinations() {
  const [state, setState] = useState({ status: 'loading', products: [] });

  useEffect(() => {
    const controller = new AbortController();

    getProducts({ type: 'TRIP', limit: 3 }, { signal: controller.signal })
      .then((data) => setState({ status: 'success', products: data.items }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error', products: [] });
      });

    // Annule la requête si on quitte la page avant la réponse
    return () => controller.abort();
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="mt-8 grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Chargement des destinations">
        {[1, 2, 3].map((key) => (
          <div key={key} className="h-96 rounded-carte bg-stratosphere motion-safe:animate-pulse" />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <p role="alert" className="mt-8 rounded-carte bg-stratosphere p-6 text-brume">
        Les destinations n'ont pas pu être chargées. Réessayez dans quelques instants.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid gap-6 md:grid-cols-3">
      {state.products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

function HomePage() {
  return (
    <>
      <title>Orbea Spacelines · Agence de tourisme spatial</title>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-48 pt-20 lg:px-16 lg:pb-64 lg:pt-28">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">Agence de tourisme spatial</p>
          <h1 className="mt-4 max-w-3xl font-display text-[40px] font-extrabold leading-[1.05] lg:text-7xl lg:leading-[76px]">
            Voyez la Terre se lever depuis l'orbite
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brume">
            Orbéa vous emmène en orbite, autour de la Lune et jusqu'à Mars. Choisissez votre destination, votre
            date de départ et votre classe de voyage.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink to="/destinations">Découvrir les destinations</ButtonLink>
            <ButtonLink to="/boutique" variant="secondary">
              Visiter la boutique
            </ButtonLink>
          </div>
        </div>

        {/* Courbe lumineuse de la planète, signature visuelle de la charte */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[calc(100%-9rem)] aspect-square w-[220vw] -translate-x-1/2 rounded-full border-t border-aube/60 bg-stratosphere shadow-[0_-20px_80px_rgba(255,138,80,0.35)] lg:top-[calc(100%-13rem)] lg:w-[160vw]"
        />
      </section>

      {/* Destinations à la une */}
      <section aria-labelledby="titre-destinations" className="mx-auto max-w-7xl px-4 py-20 lg:px-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">À la une</p>
            <h2 id="titre-destinations" className="mt-2 font-display text-[32px] font-bold leading-[38px]">
              Nos destinations
            </h2>
          </div>
          <ButtonLink to="/destinations" variant="secondary">
            Voir tout le catalogue
          </ButtonLink>
        </div>
        <FeaturedDestinations />
      </section>

      {/* Arguments */}
      <section aria-labelledby="titre-arguments" className="mx-auto max-w-7xl px-4 pb-20 lg:px-16">
        <h2 id="titre-arguments" className="sr-only">
          Pourquoi voyager avec Orbéa
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {arguments_.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-carte border border-trait p-6">
              <Icon aria-hidden="true" strokeWidth={1.5} className="size-8 text-aube" />
              <h3 className="mt-4 font-display text-[22px] font-bold leading-7">{title}</h3>
              <p className="mt-2 text-brume">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Bandeau boutique */}
      <section aria-labelledby="titre-boutique" className="mx-auto max-w-7xl px-4 pb-20 lg:px-16">
        <div className="flex flex-col gap-6 rounded-carte bg-stratosphere p-8 md:flex-row md:items-center md:justify-between lg:p-12">
          <div>
            <h2 id="titre-boutique" className="font-display text-[32px] font-bold leading-[38px]">
              Un souvenir de là-haut
            </h2>
            <p className="mt-2 max-w-xl text-brume">
              Vêtements, accessoires et objets de collection aux couleurs d'Orbéa.
            </p>
          </div>
          <ButtonLink to="/boutique" variant="secondary" className="shrink-0">
            Découvrir la boutique
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

export default HomePage;