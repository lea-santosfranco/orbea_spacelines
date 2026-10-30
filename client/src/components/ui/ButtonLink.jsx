import { Link } from 'react-router';

const base =
  'inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-bold motion-safe:transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';

const variants = {
  primary: 'bg-aube text-abysse hover:bg-aube-survol hover:shadow-lueur-aube',
  secondary: 'border border-contour text-neige hover:bg-stratosphere-haute',
};

// Lien affiché comme un bouton de la charte (principal ou secondaire)
function ButtonLink({ to, variant = 'primary', className = '', children }) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export default ButtonLink;