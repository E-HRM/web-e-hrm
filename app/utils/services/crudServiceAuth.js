import Cookies from 'js-cookie';

/**
 * crudServiceAuth
 * - Selalu kirim cookie session (NextAuth) via credentials: 'include'
 * - Authorization hanya dikirim kalau token ada (hindari "Bearer undefined")
 * - Support JSON dan FormData
 */
async function requestAuth(endpoint, method = 'GET', body = undefined, options = {}) {
  const token = Cookies.get('token');
  const headers = new Headers(options.headers || {});

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  // Jangan paksa Content-Type untuk FormData (biar boundary aman)
  if (!isFormData && body !== undefined && body !== null) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  }

  // Authorization hanya kalau token beneran ada
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(endpoint, {
    method,
    headers,
    credentials: 'include',
    body:
      body === undefined || body === null
        ? undefined
        : isFormData
          ? body
          : JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

  if (!res.ok) {
    const msg =
      (typeof data === 'object' && (data?.message || data?.error)) ||
      (typeof data === 'string' && data) ||
      `Request gagal (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}

export const crudServiceAuth = {
  get: (endpoint, options) => requestAuth(endpoint, 'GET', undefined, options),
  post: (endpoint, data, options) => requestAuth(endpoint, 'POST', data, options),
  put: (endpoint, data, options) => requestAuth(endpoint, 'PUT', data, options),
  patch: (endpoint, data, options) => requestAuth(endpoint, 'PATCH', data, options),
  delete: (endpoint, data, options) => requestAuth(endpoint, 'DELETE', data, options),

  // helper kalau upload file
  postForm: (endpoint, formData, options) => requestAuth(endpoint, 'POST', formData, options),
  patchForm: (endpoint, formData, options) => requestAuth(endpoint, 'PATCH', formData, options),

  request: (endpoint, method, body, options) => requestAuth(endpoint, method, body, options),
};
