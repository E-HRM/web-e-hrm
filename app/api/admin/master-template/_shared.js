import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';

export const ADMIN_ROLES = new Set(['HR', 'OPERASIONAL', 'DIREKTUR', 'SUPERADMIN', 'SUBADMIN', 'SUPERVISI']);
export const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'nama_template']);

function isFileLike(value) {
  return value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && 'size' in value;
}

function guessExt(filename) {
  const parts = String(filename || '').split('.');
  if (parts.length > 1) {
    const ext = parts.pop().toLowerCase();
    if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  }
  return 'bin';
}

function sanitizePathPart(value) {
  const safe = String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);

  return safe || 'file';
}

function randomFilenameBase() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const err = new Error('Supabase env tidak lengkap. Butuh SUPABASE_URL (atau NEXT_PUBLIC_SUPABASE_URL) dan SUPABASE_SERVICE_ROLE_KEY.');
    err.code = 'SUPABASE_ENV_MISSING';
    throw err;
  }

  return createClient(url, key);
}

function extractSupabaseBucketPath(publicUrl) {
  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      return {
        bucket: match[1],
        path: decodeURIComponent(match[2]),
      };
    }
  } catch (_) {}

  const fallbackMatch = String(publicUrl || '').match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (fallbackMatch) {
    return {
      bucket: fallbackMatch[1],
      path: decodeURIComponent(fallbackMatch[2]),
    };
  }

  return null;
}

export function getMasterTemplateDelegate() {
  return db?.master_template || db?.masterTemplate || null;
}

export async function getActor(req) {
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    try {
      const payload = await verifyAuthToken(token);
      const id = payload?.sub || payload?.id_user || payload?.userId || payload?.id;
      const role = payload?.role || payload?.jabatan || payload?.level || payload?.akses;

      if (id && role) {
        return {
          actor: {
            id: String(id),
            role: String(role).toUpperCase(),
            source: 'token',
          },
        };
      }
    } catch (_) {
      /* fallback session */
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: String(sessionOrRes.user.id),
      role: String(sessionOrRes.user.role).toUpperCase(),
      source: 'session',
    },
  };
}

export function guardAdmin(actor) {
  const role = String(actor?.role || '').toUpperCase();
  if (!ADMIN_ROLES.has(role)) {
    return NextResponse.json({ message: 'Forbidden: hanya admin yang dapat mengakses resource ini.' }, { status: 403 });
  }
  return null;
}

export function isNullLike(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return true;
    const lowered = trimmed.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') return true;
  }
  return false;
}

export function pickFirstFile(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const found = value.find((item) => isFileLike(item) && item.size > 0);
    return found || null;
  }
  if (isFileLike(value) && value.size > 0) return value;
  return null;
}

export function getTemplateFileFromBody(body) {
  const fileKeys = ['file_template', 'file', 'template_file', 'template', 'master_template_file'];
  for (const key of fileKeys) {
    const file = pickFirstFile(body?.[key]);
    if (file) return file;
  }
  return null;
}

export async function uploadTemplateToSupabase(file, { prefix = 'master-template', filenameBase } = {}) {
  if (!isFileLike(file)) {
    const err = new Error('File template tidak valid untuk diunggah.');
    err.status = 400;
    throw err;
  }

  const supabase = getSupabase();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'e-hrm';
  const ext = guessExt(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeBase = sanitizePathPart(filenameBase);
  const finalBase = safeBase || `${Date.now()}-${randomFilenameBase()}`;
  const path = `${sanitizePathPart(prefix)}/${Date.now()}-${finalBase}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType: file.type || 'application/octet-stream',
  });

  if (uploadError) {
    const err = new Error(`Gagal upload file template ke Supabase: ${uploadError.message}`);
    err.status = 502;
    throw err;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl: data?.publicUrl || null,
  };
}

export async function deleteSupabaseByPublicUrl(publicUrl) {
  if (!publicUrl) return { deleted: false, reason: 'empty' };

  const info = extractSupabaseBucketPath(publicUrl);
  if (!info) return { deleted: false, reason: 'not-supabase-url' };

  const supabase = getSupabase();
  const { error } = await supabase.storage.from(info.bucket).remove([info.path]);

  if (error) {
    return { deleted: false, reason: 'remove-failed', error: error.message };
  }

  return {
    deleted: true,
    bucket: info.bucket,
    path: info.path,
  };
}
