const STEPS = ['Panier', 'Récapitulatif', 'Paiement', 'Confirmation'];

// Fil des étapes de commande ; current est l'index de l'étape en cours
function CheckoutSteps({ current }) {
  return (
    <ol aria-label="Étapes de la commande" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {STEPS.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? 'step' : undefined}
          className={`flex items-center gap-2 ${index === current ? 'font-bold text-neige' : 'text-brume'}`}
        >
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
              index <= current ? 'bg-aube text-abysse' : 'border border-contour'
            }`}
          >
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

export default CheckoutSteps;
