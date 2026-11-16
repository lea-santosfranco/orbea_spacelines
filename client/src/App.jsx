import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Layout from './components/layout/Layout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import HomePage from './pages/public/HomePage.jsx';
import CatalogPage from './pages/public/CatalogPage.jsx';
import ProductDetailPage from './pages/public/ProductDetailPage.jsx';
import LegalNoticePage from './pages/legal/LegalNoticePage.jsx';
import PrivacyPage from './pages/legal/PrivacyPage.jsx';
import TermsPage from './pages/legal/TermsPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import AuthProvider from './context/AuthProvider.jsx';
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
      { path: 'destinations', element: <CatalogPage key="TRIP" type="TRIP" /> },
      { path: 'destinations/:slug', element: <ProductDetailPage key="TRIP" type="TRIP" /> },
      { path: 'boutique', element: <CatalogPage key="GOODIE" type="GOODIE" /> },
      { path: 'boutique/:slug', element: <ProductDetailPage key="GOODIE" type="GOODIE" /> },
      { path: 'panier', element: <PlaceholderPage title="Panier" story="US 8, US 9" /> },
      { path: 'connexion', element: <LoginPage /> },

      // Pages réservées aux clients connectés
      {
        element: <RequireAuth />,
        children: [
          // Parcours de commande
          { path: 'commande', element: <PlaceholderPage title="Récapitulatif de commande" story="US 13" /> },
          { path: 'commande/confirmation', element: <PlaceholderPage title="Confirmation" story="US 14" /> },

          // Espace client
          { path: 'compte', element: <Navigate to="/compte/commandes" replace /> },
          { path: 'compte/commandes', element: <PlaceholderPage title="Mes commandes" story="Espace client" /> },
          { path: 'compte/commandes/:id', element: <PlaceholderPage title="Détail de la commande" story="Espace client" /> },
          { path: 'compte/favoris', element: <PlaceholderPage title="Mes favoris" story="Espace client" /> },
          { path: 'compte/profil', element: <PlaceholderPage title="Mon profil" story="Espace client" /> },
        ],
      },

      // Pages légales
      { path: 'mentions-legales', element: <LegalNoticePage /> },
      { path: 'confidentialite', element: <PrivacyPage /> },
      { path: 'cgv', element: <TermsPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin',
    element: (
      <RequireAuth role="ADMIN">
        <AdminLayout />
      </RequireAuth>
    ),
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
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;