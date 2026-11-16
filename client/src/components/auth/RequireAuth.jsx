import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/useAuth.js';

// Protège un groupe de routes : sans connexion, redirige vers /connexion en mémorisant la page demandée.
// Avec role="ADMIN", un utilisateur connecté sans ce rôle est renvoyé à l'accueil.
// Ce contrôle est un confort d'affichage : la vraie sécurité est faite par l'API sur chaque route.
function RequireAuth({ role, children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <p role="status" className="px-4 py-24 text-center text-brume">
        Vérification de la connexion…
      </p>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children ?? <Outlet />;
}

export default RequireAuth;
