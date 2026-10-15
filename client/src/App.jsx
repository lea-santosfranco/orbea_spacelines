const buttonBase = `
  h-12 rounded-full px-6 text-[15px] font-bold
  motion-safe:transition
  focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-aube
`;

const buttonPrimary = `
  ${buttonBase}
  bg-aube text-abysse
  hover:bg-aube-survol hover:shadow-lueur-aube
`;

const buttonSecondary = `
  ${buttonBase}
  border border-contour text-neige
  hover:bg-stratosphere-haute
`;

const badge = 'rounded-full px-3 py-1 text-xs font-bold';

function App() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">
        Tourisme spatial
      </p>

      <h1 className="mt-3 font-display text-4xl font-extrabold md:text-7xl">
        orbéa<span className="text-aube">.</span>
      </h1>

      <p className="mt-4 text-lg text-brume">
        Le front React fonctionne, avec la charte Horizon dans Tailwind.
      </p>

      <section className="mt-8 rounded-carte bg-stratosphere p-6">
        <h2 className="font-display text-2xl font-bold">Composants de test</h2>

        <div className="mt-6 flex flex-wrap gap-4">
          <button type="button" className={buttonPrimary}>
            Réserver un voyage
          </button>
          <button type="button" className={buttonSecondary}>
            Voir la boutique
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className={`${badge} bg-ciel text-abysse`}>Classe affaires</span>
          <span className={`${badge} bg-vigilance text-abysse`}>2 places</span>
          <span className={`${badge} bg-succes text-abysse`}>Payée</span>
          <span className={`${badge} border border-contour text-brume`}>
            Complet
          </span>
        </div>
      </section>
    </main>
  );
}

export default App;