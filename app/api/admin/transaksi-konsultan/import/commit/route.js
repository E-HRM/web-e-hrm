export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { commitImportRows, ensureImportAuth, guardImportRole } from '../_helpers';

export async function POST(req) {
  const auth = await ensureImportAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardImportRole(auth.actor);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const result = await commitImportRows({
      idPeriodeKonsultan: body?.id_periode_konsultan,
      rows: body?.rows,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          message: 'Validasi import transaksi konsultan gagal.',
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: `Import transaksi konsultan selesai. ${result.created} baris berhasil dibuat.`,
        summary: {
          created: result.created,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Payload JSON tidak valid.' }, { status: 400 });
    }

    if (err instanceof Error) {
      if (
        err.message.includes('Periode') ||
        err.message.includes('tidak ditemukan') ||
        err.message.includes('dihapus') ||
        err.message.includes('terkunci')
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/transaksi-konsultan/import/commit error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
