// lib/jwt_utils_mobile.js
import jwt from 'jsonwebtoken';

/**
 * ENV yang dipakai:
 * - JWT_SECRET          (wajib) rahasia signing
 * - JWT_ISSUER          (opsional) issuer token, contoh: "e-hrm"
 * - JWT_AUDIENCE        (opsional) audience token, contoh: "mobile"
 * - MOBILE_ACCESS_TTL   (opsional) lama access token, default "15m"
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || undefined;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'mobile';
const ACCESS_TTL = process.env.MOBILE_ACCESS_TTL || '15m';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required for jwt_utils_mobile.js');
}

/**
 * Membuat access token pendek untuk mobile.
 * @param {{ sub:string, role?:string, [key:string]:any }} claims - Minimal berisi sub (id_user).
 * @param {{ expiresIn?:string|number, issuer?:string, audience?:string }} [opts]
 * @returns {string} JWT string
 */ 
export function signAccessToken(claims, opts = {}) {
  const payload = {
    // standard claims:
    sub: claims.sub,
    role: claims.role,
    // custom tambahan bila perlu:
    ...claims,
  };

  const signOpts = {
    expiresIn: ACCESS_TTL,
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    ...opts,
  };

  return jwt.sign(payload, JWT_SECRET, signOpts);
}

/**
 * Verifikasi access token.
 * @param {string} token
 * @param {{ audience?:string|string[], issuer?:string|string[], clockTolerance?:number }} [opts]
 * @returns {import('jsonwebtoken').JwtPayload}
 * @throws jika token invalid/expired
 */
export function verifyAccessToken(token, opts = {}) {
  return jwt.verify(token, JWT_SECRET, {
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER,
    clockTolerance: 5, // detik toleransi drift waktu
    ...opts,
  });
}

/**
 * Decode tanpa verifikasi (hanya untuk membaca header/payload).
 * @param {string} token
 * @returns {null|{[key:string]:any}}
 */
export function decode(token) {
  return jwt.decode(token);
}

/**
 * Ambil bearer token dari Request (Next.js Request atau Node req standar).
 * @param {Request|{headers?:any}} req
 * @returns {string|null}
 */
export function getBearerTokenFromRequest(req) {
  // Next.js Request
  const fromNext = typeof req?.headers?.get === 'function' ? req.headers.get('authorization') : undefined;

  // Node/Express-like
  const fromNode = typeof req?.headers === 'object' ? req.headers['authorization'] || req.headers['Authorization'] : undefined;

  const auth = (fromNext ?? fromNode ?? '').toString();
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

/**
 * Helper: verifikasi langsung dari request; throw jika gagal.
 * @param {Request|{headers?:any}} req
 * @returns {import('jsonwebtoken').JwtPayload}
 */
export function requireAccessFromRequest(req) {
  const token = getBearerTokenFromRequest(req);
  if (!token) {
    const e = new Error('Missing Bearer token');
    e.code = 'NO_BEARER';
    throw e;
  }
  return verifyAccessToken(token);
}
