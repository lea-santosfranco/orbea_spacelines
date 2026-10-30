import { Outlet, ScrollRestoration } from 'react-router';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-aube focus:px-6 focus:py-3 focus:font-bold focus:text-abysse"
      >
        Aller au contenu
      </a>

      <Header />

      <main id="contenu" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <ScrollRestoration />
    </div>
  );
}

export default Layout;