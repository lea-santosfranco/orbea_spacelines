import { Link } from 'react-router';

function Logo() {
  return (
    <Link
      to="/"
      aria-label="Orbea Spacelines, accueil"
      className="rounded-full font-display text-2xl font-extrabold lowercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-aube"
    >
      orbéa<span className="text-aube">.</span>
    </Link>
  );
}

export default Logo;