// Page temporaire, remplacée par la vraie page lors de la user story correspondante
function PlaceholderPage({ title, story }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-16">
      <title>{`${title} · Orbea Spacelines`}</title>
      {story && <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">{story}</p>}
      <h1 className="mt-3 font-display text-3xl font-bold">{title}</h1>
      <p className="mt-4 text-brume">Page en construction.</p>
    </section>
  );
}

export default PlaceholderPage;