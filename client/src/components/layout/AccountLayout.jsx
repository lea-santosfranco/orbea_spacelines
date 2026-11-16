import { NavLink, Outlet, useNavigate } from 'react-router';
import { Heart, LogOut, Receipt, UserRound } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';

const links = [
  { to: '/compte/commandes', label: 'Mes commandes', icon: Receipt },
  { to: '/compte/favoris', label: 'Mes favoris', icon: Heart },
  { to: '/compte/profil', label: 'Mon profil', icon: UserRound },
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const itemClass = `flex items-center gap-3 rounded-full px-4 py-3 font-bold motion-safe:transition hover:bg-stratosphere-haute hover:text-neige ${focusRing}`;

// Mise en page de l'espace client : menu latéral + contenu de la page
function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-16 lg:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ciel">Espace client</p>
      <p className="mt-2 text-brume">Bonjour {user.firstName}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <nav aria-label="Espace client">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {links.map(({ to, label, icon: Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `${itemClass} ${isActive ? 'bg-stratosphere-haute text-neige' : 'text-brume'}`
                  }
                >
                  <Icon aria-hidden="true" strokeWidth={1.5} className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="shrink-0">
              <button type="button" onClick={handleLogout} className={`${itemClass} w-full text-brume`}>
                <LogOut aria-hidden="true" strokeWidth={1.5} className="size-5" />
                Se déconnecter
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AccountLayout;
