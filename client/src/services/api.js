// Point d'entrée unique pour tous les appels à l'API

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => null);

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
