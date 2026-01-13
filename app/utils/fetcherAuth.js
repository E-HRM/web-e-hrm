import Cookies from 'js-cookie';

/**
 * fetcherAuth
 * - Selalu kirim cookie session (NextAuth) via credentials: 'include'
 * - Hanya kirim Authorization kalau token beneran ada
 * - Cocok untuk SWR
 */
export async function fetcherAuth(url, init = {}) {
  const token = Cookies.get('token');

  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

  if (!res.ok) {
    // Usahakan message yang enak dibaca
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
