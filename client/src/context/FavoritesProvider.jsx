import { useCallback, useEffect, useMemo, useState } from 'react';
import { FavoritesContext } from './favoritesContext.js';
import { useAuth } from './useAuth.js';
import * as api from '../services/api.js';

// Les favoris sont réservés aux clients connectés : la liste est rechargée à chaque connexion
function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState({ userId: null, products: [] });

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    api
      .getFavorites({ signal: controller.signal })
      .then((products) => setState({ userId, products }))
      .catch(() => {});
    return () => controller.abort();
  }, [userId]);

  // Si l'utilisateur a changé (déconnexion), les favoris de l'ancien compte ne sont plus valables
  const products = useMemo(() => (state.userId === userId ? state.products : []), [state, userId]);
  const favoriteIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);
  const isLoading = Boolean(userId) && state.userId !== userId;

  const toggle = useCallback(
    async (productId) => {
      const next = favoriteIds.has(productId) ? await api.removeFavorite(productId) : await api.addFavorite(productId);
      setState({ userId, products: next });
    },
    [favoriteIds, userId],
  );

  const value = useMemo(
    () => ({ products, favoriteIds, isLoading, toggle }),
    [products, favoriteIds, isLoading, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export default FavoritesProvider;
