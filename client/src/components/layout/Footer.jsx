import { Link } from 'react-router';

const legalLinks = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/confidentialite', label: 'Politique de confidentialité' },
  { to: '/cgv', label: 'CGV' },
];

function Footer() {
  return (
    <footer className="border-t border-trait">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-brume md:flex-row md:items-center md:justify-between lg:px-16">
        <p>© 2026 Orbea Spacelines · Agence fictive, projet de formation</p>
        <nav aria-label="Liens légaux">
          <ul className="flex flex-col gap-2 md:flex-row md:gap-6">
            {legalLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="rounded hover:text-neige focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;