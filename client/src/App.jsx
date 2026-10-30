import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Layout from './components/layout/Layout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import HomePage from './pages/public/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ErrorPage from './pages/ErrorPage.jsx';

// Les pages « en construction » seront remplacées au fil des user stories
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      // Pages publiques
      { index: true, element: <HomePage /> },
      { path: 'destinations', element: <PlaceholderPage title="Destinations" story="US 2" /> },
      { path: 'destinations/:slug', element: <PlaceholderPage title="Fiche voyage" story="US 6" /> },
      { path: 'boutique', element: <PlaceholderPage title="Boutique" story="US 3" /> },
      { path: 'boutique/:slug', element: <PlaceholderPage title="Fiche goodie" story="US 7" /> },
      { path: 'panier', element: <PlaceholderPage title="Panier" story="US 8, US 9" /> },
      { path: 'connexion', element: <PlaceholderPage title="Connexion" story="US 10, US 11" /> },

      // Parcours de commande (client connecté)
      { path: 'commande', element: <PlaceholderPage title="Récapitulatif de commande" story="US 13" /> },
      { path: 'commande/confirmation', element: <PlaceholderPage title="Confirmation" story="US 14" /> },

      // Espace client
      { path: 'compte', element: <Navigate to="/compte/commandes" replace /> },
      { path: 'compte/commandes', element: <PlaceholderPage title="Mes commandes" story="Espace client" /> },
      { path: 'compte/commandes/:id', element: <PlaceholderPage title="Détail de la commande" story="Espace client" /> },
      { path: 'compte/favoris', element: <PlaceholderPage title="Mes favoris" story="Espace client" /> },
      { path: 'compte/profil', element: <PlaceholderPage title="Mon profil" story="Espace client" /> },

      // Pages légales
      { path: 'mentions-legales', element: <PlaceholderPage title="Mentions légales" story="US 12" /> },
      { path: 'confidentialite', element: <PlaceholderPage title="Politique de confidentialité" story="US 12" /> },
      { path: 'cgv', element: <PlaceholderPage title="Conditions générales de vente" story="US 12" /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin',
    element: <AdminLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <PlaceholderPage title="Tableau de bord" story="Administration" /> },
      { path: 'produits', element: <PlaceholderPage title="Produits" story="Administration" /> },
      { path: 'produits/:id', element: <PlaceholderPage title="Formulaire produit" story="Administration" /> },
      { path: 'categories', element: <PlaceholderPage title="Catégories" story="Administration" /> },
      { path: 'commandes', element: <PlaceholderPage title="Commandes" story="Administration" /> },
      { path: 'utilisateurs', element: <PlaceholderPage title="Utilisateurs" story="Administration" /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;