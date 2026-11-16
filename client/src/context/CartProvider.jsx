import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './cartContext.js';
import { useAuth } from './useAuth.js';
import * as api from '../services/api.js';

const emptyCart = { items: [], itemCount: 0, subtotalCents: 0, hasIssues: false };

// Le panier est gardé par l'API (en base) : ce contexte en garde une copie pour l'affichage
// et la remplace par la réponse de l'API après chaque modification.
function CartProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [cart, setCart] = useState(emptyCart);
  const [loadedFor, setLoadedFor] = useState(undefined);

  // Recharge le panier au démarrage et à chaque connexion / déconnexion
  // (à la connexion, l'API vient de fusionner le panier visiteur avec celui du compte)
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();

    api
      .getCart({ signal: controller.signal })
      .then((data) => {
        setCart(data);
        setLoadedFor(userId);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setCart(emptyCart);
          setLoadedFor(userId);
        }
      });

    return () => controller.abort();
  }, [authLoading, userId]);

  const addItem = useCallback(async (variantId, quantity) => {
    const data = await api.addCartItem(variantId, quantity);
    setCart(data);
    return data;
  }, []);

  const updateItem = useCallback(async (variantId, quantity) => {
    const data = await api.updateCartItem(variantId, quantity);
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (variantId) => {
    const data = await api.removeCartItem(variantId);
    setCart(data);
    return data;
  }, []);

  const isLoading = authLoading || loadedFor !== userId;

  const value = useMemo(
    () => ({ cart, isLoading, addItem, updateItem, removeItem }),
    [cart, isLoading, addItem, updateItem, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
