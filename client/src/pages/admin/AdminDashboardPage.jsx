import { useEffect, useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import { focusRing, tableClass, tdClass, thClass } from '../../components/admin/adminStyles.js';
import { admin } from '../../services/api.js';
import { formatDate, formatPrice, TRAVEL_CLASS_LABELS } from '../../utils/format.js';

const PERIODS = [
  { value: 30, label: '30 jours' },
  { value: 90, label: '3 mois' },
  { value: 365, label: '12 mois' },
];

const percent = (ratio) => `${Math.round(ratio * 100)} %`;
const shortDate = (iso) => {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
};

function KpiTile({ label, value, hint }) {
  return (
    <div className="rounded-carte bg-stratosphere p-5">
      <p className="text-sm text-brume">{label}</p>
      <p className="mt-2 font-display text-[28px] font-bold leading-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-brume">{hint}</p>}
    </div>
  );
}

// Histogramme du chiffre d'affaires par semaine : une seule couleur, une info-bulle au survol ou au clavier
function WeeklyRevenueChart({ weeks }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...weeks.map((week) => week.revenueCents), 1);
  const labelEvery = Math.ceil(weeks.length / 8); // au plus ~8 dates sous l'axe

  return (
    <div>
      <div className="relative mt-6 h-56" onPointerLeave={() => setActive(null)}>
        {/* Lignes de repère discrètes : 0, moitié, maximum */}
        {[0, 0.5, 1].map((ratio) => (
          <div key={ratio} className="absolute inset-x-0 border-t border-trait" style={{ bottom: `${ratio * 100}%` }}>
            <span className="absolute -top-2.5 left-0 bg-stratosphere pr-2 text-xs text-brume">
              {formatPrice(Math.round(max * ratio))}
            </span>
          </div>
        ))}

        <ul className="absolute inset-0 left-24 flex items-end gap-0.5">
          {weeks.map((week, index) => (
            <li key={week.week} className="relative flex h-full flex-1 items-end">
              {/* La zone de survol couvre toute la hauteur : plus facile à viser que la barre seule */}
              <button
                type="button"
                onPointerEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                aria-label={`Semaine du ${formatDate(week.week)} : ${formatPrice(week.revenueCents)}, ${week.orders} commande(s)`}
                className={`flex h-full w-full items-end ${focusRing}`}
              >
                <span
                  className={`block w-full rounded-t-[4px] motion-safe:transition-colors ${
                    active === index ? 'bg-aube-survol' : 'bg-aube'
                  }`}
                  style={{ height: `${(week.revenueCents / max) * 100}%`, minHeight: week.revenueCents ? 2 : 0 }}
                />
              </button>
              {active === index && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-champ border border-contour bg-abysse px-3 py-2 text-xs shadow-lg"
                >
                  <p className="text-sm font-bold text-neige">{formatPrice(week.revenueCents)}</p>
                  <p className="text-brume">
                    Semaine du {formatDate(week.week)} · {week.orders} commande(s)
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="ml-24 mt-2 flex gap-0.5 text-xs text-brume">
        {weeks.map((week, index) => (
          <span key={week.week} className="flex-1 text-center">
            {index % labelEvery === 0 ? shortDate(week.week) : ''}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className={`cursor-pointer text-ciel ${focusRing}`}>Voir les données en tableau</summary>
        <table className={`${tableClass} mt-2`}>
          <thead>
            <tr>
              <th scope="col" className={thClass}>
                Semaine du
              </th>
              <th scope="col" className={`${thClass} text-right`}>
                Commandes
              </th>
              <th scope="col" className={`${thClass} text-right`}>
                Chiffre d'affaires
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-trait">
            {weeks.map((week) => (
              <tr key={week.week}>
                <td className={tdClass}>{formatDate(week.week)}</td>
                <td className={`${tdClass} text-right`}>{week.orders}</td>
                <td className={`${tdClass} text-right`}>{formatPrice(week.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// Barre horizontale avec son libellé et sa valeur écrits à côté (jamais la couleur seule)
function LabeledBar({ label, value, ratio, detail }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-bold">{label}</span>
        <span className="whitespace-nowrap">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-stratosphere-haute">
        <div className="h-2 rounded-full bg-aube" style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
      {detail && <p className="mt-1 text-xs text-brume">{detail}</p>}
    </li>
  );
}

function AdminDashboardPage() {
  const [period, setPeriod] = useState(30);
  const [result, setResult] = useState({ period: null, stats: null, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    admin
      .getStats(period, { signal: controller.signal })
      .then((stats) => setResult({ period, stats, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ period, stats: null, error: error.message });
      });
    return () => controller.abort();
  }, [period]);

  const { stats } = result;
  const isLoading = result.period !== period;
  const totalByType = stats ? stats.salesByType.reduce((sum, row) => sum + row.revenueCents, 0) : 0;
  const topMax = stats?.topProducts[0]?.revenueCents ?? 1;

  return (
    <div className="p-6 lg:p-10">
      <title>Tableau de bord · Administration Orbea</title>
      <AdminPageHeader title="Tableau de bord" subtitle="Ventes et remplissage des départs">
        <div role="group" aria-label="Période" className="flex gap-1 rounded-full bg-stratosphere p-1">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${focusRing} ${
                period === option.value ? 'bg-stratosphere-haute text-neige' : 'text-brume hover:text-neige'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </AdminPageHeader>

      {result.error && (
        <p role="alert" className="mt-8 text-erreur">
          {result.error}
        </p>
      )}

      {stats && (
        <div
          className={`mt-8 flex flex-col gap-6 motion-safe:transition-opacity ${isLoading ? 'opacity-50' : ''}`}
          aria-busy={isLoading}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Chiffre d'affaires"
              value={formatPrice(stats.kpis.revenueCents)}
              hint="Commandes payées, hors annulations"
            />
            <KpiTile label="Commandes payées" value={stats.kpis.paidOrders} />
            <KpiTile label="Panier moyen" value={formatPrice(stats.kpis.averageOrderCents)} />
            <KpiTile
              label="Remplissage moyen"
              value={percent(stats.kpis.averageFillRate)}
              hint="Sur tous les départs à venir"
            />
          </div>

          <section aria-labelledby="titre-ca" className="rounded-carte border border-trait p-6">
            <h2 id="titre-ca" className="font-display text-[22px] font-bold">
              Chiffre d'affaires par semaine
            </h2>
            <WeeklyRevenueChart weeks={stats.revenueByWeek} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="titre-types" className="rounded-carte border border-trait p-6">
              <h2 id="titre-types" className="font-display text-[22px] font-bold">
                Voyages et goodies
              </h2>
              <ul className="mt-6 flex flex-col gap-5">
                {stats.salesByType.map((row) => (
                  <LabeledBar
                    key={row.type}
                    label={row.type === 'TRIP' ? 'Voyages' : 'Goodies'}
                    value={formatPrice(row.revenueCents)}
                    ratio={totalByType ? row.revenueCents / totalByType : 0}
                    detail={`${row.quantity} ${row.type === 'TRIP' ? 'place(s) vendue(s)' : 'article(s) vendu(s)'} · ${percent(
                      totalByType ? row.revenueCents / totalByType : 0,
                    )} du CA`}
                  />
                ))}
              </ul>
            </section>

            <section aria-labelledby="titre-top" className="rounded-carte border border-trait p-6">
              <h2 id="titre-top" className="font-display text-[22px] font-bold">
                Meilleures ventes
              </h2>
              {stats.topProducts.length === 0 ? (
                <p className="mt-4 text-brume">Aucune vente sur la période.</p>
              ) : (
                <ol className="mt-6 flex flex-col gap-5">
                  {stats.topProducts.map((product) => (
                    <LabeledBar
                      key={product.id}
                      label={product.name}
                      value={formatPrice(product.revenueCents)}
                      ratio={product.revenueCents / topMax}
                      detail={`${product.quantity} ${product.type === 'TRIP' ? 'place(s)' : 'article(s)'}`}
                    />
                  ))}
                </ol>
              )}
            </section>
          </div>

          <section aria-labelledby="titre-departs" className="rounded-carte border border-trait p-6">
            <h2 id="titre-departs" className="font-display text-[22px] font-bold">
              Remplissage des prochains départs
            </h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {stats.upcomingDepartures.map((departure) => (
                <LabeledBar
                  key={departure.id}
                  label={`${departure.name} · ${TRAVEL_CLASS_LABELS[departure.travelClass]}`}
                  value={percent(departure.fillRate)}
                  ratio={departure.fillRate}
                  detail={`Départ le ${formatDate(departure.departureDate)} · ${departure.sold} / ${departure.capacity} places vendues`}
                />
              ))}
            </ul>
          </section>
        </div>
      )}

      {!stats && !result.error && (
        <p role="status" className="mt-8 text-brume">
          Chargement des statistiques…
        </p>
      )}
    </div>
  );
}

export default AdminDashboardPage;
