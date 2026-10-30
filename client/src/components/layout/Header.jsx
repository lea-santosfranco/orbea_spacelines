import { useId, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import Logo from './Logo.jsx';

const mainLinks = [
  { to: '/destinations', label: 'Destinations' },
  { to: '/boutique', label: 'Boutique' },
];

const mobileLinks = [
  ...mainLinks,
  { to: '/compte/favoris', label: 'Mes favoris' },
  { to: '/compte', label: 'Mon compte' },
];

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 font-bold motion-safe:transition hover:text-neige ${focusRing} ${
    isActive ? 'text-neige' : 'text-brume'
  }`;

const iconButtonClass = `relative flex size-11 items-center justify-center rounded-full text-brume motion-safe:transition hover:bg-stratosphere-haute hover:text-neige ${focusRing}`;

function SearchForm({ className = '', onSearch }) {
  const inputId = useId();
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q').trim();
    navigate(query ? `/destinations?q=${encodeURIComponent(query)}` : '/destinations');
    onSearch?.();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className={`relative ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Rechercher une destination
      </label>
      <Search
        aria-hidden="true"
        strokeWidth={1.5}
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-brume"
      />
      <input
        id={inputId}
        type="search"
        name="q"
        placeholder="Rechercher une destination"
        className={`h-11 w-full rounded-full border border-contour bg-stratosphere-haute pl-10 pr-4 text-sm text-neige placeholder:text-brume ${focusRing}`}
      />
    </form>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = 0; // Sera relié au contexte Panier (US 8)
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-trait">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 lg:px-16">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex gap-2">
            {mainLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={navLinkClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <SearchForm className="ml-auto hidden w-72 lg:block" />

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Link to="/compte/favoris" aria-label="Mes favoris" className={`hidden lg:flex ${iconButtonClass}`}>
            <Heart aria-hidden="true" strokeWidth={1.5} className="size-5" />
          </Link>
          <Link to="/compte" aria-label="Mon compte" className={`hidden lg:flex ${iconButtonClass}`}>
            <User aria-hidden="true" strokeWidth={1.5} className="size-5" />
          </Link>
          <Link to="/panier" aria-label={`Panier, ${cartCount} article(s)`} className={iconButtonClass}>
            <ShoppingBag aria-hidden="true" strokeWidth={1.5} className="size-5" />
            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-aube px-1 text-xs font-bold text-abysse">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className={`lg:hidden ${iconButtonClass}`}
          >
            {menuOpen ? (
              <X aria-hidden="true" strokeWidth={1.5} className="size-6" />
            ) : (
              <Menu aria-hidden="true" strokeWidth={1.5} className="size-6" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="menu-mobile" className="border-t border-trait px-4 pb-6 lg:hidden">
          <SearchForm className="mt-4" onSearch={closeMenu} />
          <nav aria-label="Navigation mobile">
            <ul className="mt-4 flex flex-col gap-1">
              {mobileLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} onClick={closeMenu} className={(state) => `block ${navLinkClass(state)}`}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;