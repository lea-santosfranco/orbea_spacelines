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
