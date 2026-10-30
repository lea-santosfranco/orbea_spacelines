import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { ArrowLeft, LayoutDashboard, Package, Receipt, Tags, Users } from 'lucide-react';
import Logo from './Logo.jsx';

// L'accès sera réservé aux administrateurs avec l'authentification (A1)
const adminLinks = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/produits', label: 'Produits', icon: Package },
  { to: '/admin/categories', label: 'Catégories', icon: Tags },
  { to: '/admin/commandes', label: 'Commandes', icon: Receipt },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-full px-4 py-3 font-bold motion-safe:transition hover:bg-stratosphere-haute hover:text-neige ${focusRing} ${
    isActive ? 'bg-stratosphere-haute text-neige' : 'text-brume'
  }`;

function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-trait bg-stratosphere p-4 md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-4 py-2">
          <Logo />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">Admin</span>
        </div>

        <nav aria-label="Navigation administration" className="mt-6">
          <ul className="flex flex-col gap-1">
            {adminLinks.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClass}>
                  <Icon aria-hidden="true" strokeWidth={1.5} className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          to="/"
          className={`mt-6 flex items-center gap-3 rounded-full px-4 py-3 text-sm text-brume hover:text-neige ${focusRing}`}
        >
          <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="size-4" />
          Retour au site
        </Link>
      </aside>

      <main className="flex-1">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

export default AdminLayout;