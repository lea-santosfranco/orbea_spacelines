// Point d'entrée unique pour tous les appels à l'API

async function request(path, options = {}) {
  // Pour un envoi de fichier (FormData), le navigateur fixe lui-même le Content-Type multipart
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
    headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
  });

  // 204 No Content : pas de corps à lire
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || 'Une erreur est survenue');
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

// Construit la chaîne « ?a=1&b=2 » en ignorant les valeurs vides
function toQueryString(params) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
}

export function getProducts(params = {}, options = {}) {
  return request(`/products${toQueryString(params)}`, options);
}

export function getCategories(params = {}, options = {}) {
  return request(`/categories${toQueryString(params)}`, options);
}

export function getProduct(slug, options = {}) {
  return request(`/products/${encodeURIComponent(slug)}`, options);
}

// ---------- Authentification ----------

export function register(data) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
}

export function login(data) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export function getMe(options = {}) {
  return request('/auth/me', options);
}

// ---------- Panier ----------

export function getCart(options = {}) {
  return request('/cart', options);
}

export function addCartItem(variantId, quantity) {
  return request('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
}

export function updateCartItem(variantId, quantity) {
  return request(`/cart/items/${variantId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
}

export function removeCartItem(variantId) {
  return request(`/cart/items/${variantId}`, { method: 'DELETE' });
}

// ---------- Commandes ----------

export function createCheckout(data) {
  return request('/orders/checkout', { method: 'POST', body: JSON.stringify(data) });
}

export function getOrder(id, options = {}) {
  return request(`/orders/${id}`, options);
}

export function getOrders(params = {}, options = {}) {
  return request(`/orders${toQueryString(params)}`, options);
}

// ---------- Compte client ----------

export function updateProfile(data) {
  return request('/account/profile', { method: 'PATCH', body: JSON.stringify(data) });
}

export function changePassword(data) {
  return request('/account/password', { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteAccount(data) {
  return request('/account', { method: 'DELETE', body: JSON.stringify(data) });
}

// ---------- Favoris ----------

export function getFavorites(options = {}) {
  return request('/favorites', options);
}

export function addFavorite(productId) {
  return request('/favorites', { method: 'POST', body: JSON.stringify({ productId }) });
}

export function removeFavorite(productId) {
  return request(`/favorites/${productId}`, { method: 'DELETE' });
}

// ---------- Administration ----------

export const admin = {
  getProducts: (params = {}, options = {}) => request(`/admin/products${toQueryString(params)}`, options),
  getProduct: (id, options = {}) => request(`/admin/products/${id}`, options),
  createProduct: (data) => request('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setArchived: (id, isArchived) =>
    request(`/admin/products/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ isArchived }) }),
  uploadImage: (id, formData) => request(`/admin/products/${id}/images`, { method: 'POST', body: formData }),
  deleteImage: (id, imageId) => request(`/admin/products/${id}/images/${imageId}`, { method: 'DELETE' }),
  setMainImage: (id, imageId) => request(`/admin/products/${id}/images/${imageId}/main`, { method: 'PATCH' }),
  getCategories: (options = {}) => request('/admin/categories', options),
  createCategory: (data) => request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),
  getOrders: (params = {}, options = {}) => request(`/admin/orders${toQueryString(params)}`, options),
  getOrder: (id, options = {}) => request(`/admin/orders/${id}`, options),
  updateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getUsers: (params = {}, options = {}) => request(`/admin/users${toQueryString(params)}`, options),
  setUserActive: (id, isActive) =>
    request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  getStats: (period, options = {}) => request(`/admin/stats?period=${period}`, options),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
};

// ---------- Avis ----------

export function getReviews(slug, options = {}) {
  return request(`/products/${encodeURIComponent(slug)}/reviews`, options);
}

export function createReview(slug, data) {
  return request(`/products/${encodeURIComponent(slug)}/reviews`, { method: 'POST', body: JSON.stringify(data) });
}

export function deleteMyReview(slug) {
  return request(`/products/${encodeURIComponent(slug)}/reviews/mine`, { method: 'DELETE' });
}
