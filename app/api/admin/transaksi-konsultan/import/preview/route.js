export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { buildImportPreview, ensureImportAuth, guardImportRole } from '../_helpers';

export async function POST(req) {
  const auth = await ensureImportAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardImportRole(auth.actor);
  if (forbidden) return forbidden;

  try {
    const form = await req.formData();
    const file = form.get('file');
    const idPeriodeKonsultan = form.get('id_periode_konsultan');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ message: 'File Excel wajib dipilih.' }, { status: 400 });
    }

    const filename = String(file.name || '').toLowerCase();
    if (filename && !filename.match(/\.(xlsx|xls)$/)) {
      return NextResponse.json({ message: 'Format file harus .xlsx atau .xls.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const preview = await buildImportPreview({
      buffer,
      idPeriodeKonsultan,
      XLSX,
    });

    return NextResponse.json({
      message: 'Preview import transaksi konsultan berhasil dibuat.',
      data: preview,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (
        err.message.includes('Periode') ||
        err.message.includes('Header') ||
        err.message.includes('Kolom') ||
        err.message.includes('Sheet') ||
        err.message.includes('tanggal') ||
        err.message.includes('terkunci') ||
        err.message.includes('dihapus')
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/transaksi-konsultan/import/preview error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
