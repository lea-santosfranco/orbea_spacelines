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
import CartProvider from './context/CartProvider.jsx';
import CartPage from './pages/public/CartPage.jsx';
import CheckoutPage from './pages/checkout/CheckoutPage.jsx';
import ConfirmationPage from './pages/checkout/ConfirmationPage.jsx';
import AccountLayout from './components/layout/AccountLayout.jsx';
import OrdersPage from './pages/account/OrdersPage.jsx';
import OrderDetailPage from './pages/account/OrderDetailPage.jsx';
import ProfilePage from './pages/account/ProfilePage.jsx';
import FavoritesPage from './pages/account/FavoritesPage.jsx';
import FavoritesProvider from './context/FavoritesProvider.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminProductFormPage from './pages/admin/AdminProductFormPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
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
      { path: 'panier', element: <CartPage /> },
      { path: 'connexion', element: <LoginPage /> },

      // Pages réservées aux clients connectés
      {
        element: <RequireAuth />,
        children: [
          // Parcours de commande
          { path: 'commande', element: <CheckoutPage /> },
          { path: 'commande/confirmation', element: <ConfirmationPage /> },

          // Espace client
          {
            path: 'compte',
            element: <AccountLayout />,
            children: [
              { index: true, element: <Navigate to="/compte/commandes" replace /> },
              { path: 'commandes', element: <OrdersPage /> },
              { path: 'commandes/:id', element: <OrderDetailPage /> },
              { path: 'favoris', element: <FavoritesPage /> },
              { path: 'profil', element: <ProfilePage /> },
            ],
          },
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
      { path: 'produits', element: <AdminProductsPage /> },
      { path: 'produits/:id', element: <AdminProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'commandes', element: <PlaceholderPage title="Commandes" story="Administration" /> },
      { path: 'utilisateurs', element: <PlaceholderPage title="Utilisateurs" story="Administration" /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <RouterProvider router={router} />
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
