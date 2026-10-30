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

export function getProducts(params = {}, options = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/products${query ? `?${query}` : ''}`, options);
}