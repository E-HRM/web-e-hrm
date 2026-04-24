import { NextResponse } from 'next/server';
import db from '@/lib/prisma';

import {
  ALLOWED_ORDER_BY,
  buildSearchClauses,
  buildSelect,
  CREATE_ROLES,
  deriveApprovalState,
  ensureCanMarkPayrollAsPaid,
  ensureAuth,
  ensurePeriodeExists,
  ensureTarifPajakTerExists,
  ensureUserExists,
  enrichPayroll,
  guardRole,
  IMMUTABLE_PERIODE_STATUS,
  JENIS_HUBUNGAN_KERJA_VALUES,
  normalizeEnum,
  normalizeNullableString,
  normalizeRequiredId,
  parseDateTime,
  parseNonNegativeDecimal,
  computePph21NominalFromSnapshot,
  computePendapatanBersihFromTotals,
  replaceApprovalSteps,
  resolveApprovalSteps,
  STATUS_APPROVAL_VALUES,
  STATUS_PAYROLL_VALUES,
  VIEW_ROLES,
  addDecimalStrings,
} from './payrollKaryawan.shared';

async function ensureProfilPayrollAktifExists(id_user) {
  return db.profilPayroll.findFirst({
    where: {
      id_user,
      deleted_at: null,
      payroll_aktif: true,
    },
    select: {
      id_profil_payroll: true,
      id_user: true,
      id_tarif_pajak_ter: true,
      jenis_hubungan_kerja: true,
      gaji_pokok: true,
      payroll_aktif: true,
      deleted_at: true,
      tarif_pajak_ter: {
        select: {
          id_tarif_pajak_ter: true,
          kode_kategori_pajak: true,
          persen_tarif: true,
          penghasilan_dari: true,
          penghasilan_sampai: true,
          berlaku_mulai: true,
          berlaku_sampai: true,
          deleted_at: true,
        },
      },
    },
  });
}

function resolveDraftDecimalStrings(body = {}, existing = null, options = {}) {
  const existingPph21 = Number(existing?.pph21_nominal || 0);
  const existingTotalPotongan = Number(existing?.total_potongan || 0);
  const existingOtherPotongan = Math.max(existingTotalPotongan - existingPph21, 0);
  const statusPayroll = String(options?.statusPayroll ?? body?.status_payroll ?? existing?.status_payroll ?? 'DRAFT')
    .trim()
    .toUpperCase();
  const allowNegativePendapatanBersih = statusPayroll === 'DRAFT';

  const totalPendapatanBruto = parseNonNegativeDecimal(body?.total_pendapatan_bruto ?? body?.total_bruto_kena_pajak ?? existing?.total_pendapatan_bruto ?? '0', 'total_pendapatan_bruto');
  const persenTarifSnapshot = options?.persenTarifSnapshot ?? existing?.persen_tarif_snapshot ?? body?.persen_tarif_snapshot ?? '0';
  const pph21Nominal = parseNonNegativeDecimal(computePph21NominalFromSnapshot(totalPendapatanBruto, persenTarifSnapshot), 'pph21_nominal');

  const totalPotonganLain = parseNonNegativeDecimal(body?.total_potongan_lain ?? existingOtherPotongan, 'total_potongan_lain');

  const totalPotongan = parseNonNegativeDecimal(body?.total_potongan ?? addDecimalStrings(pph21Nominal, totalPotonganLain), 'total_potongan');

  const pendapatanBersih = computePendapatanBersihFromTotals(totalPendapatanBruto, totalPotongan, {
    allowNegative: allowNegativePendapatanBersih,
  });

  return {
    total_pendapatan_bruto: totalPendapatanBruto,
    total_potongan: totalPotongan,
    pph21_nominal: pph21Nominal,
    pendapatan_bersih: pendapatanBersih,
  };
}

function normalizeStatusRelatedFields(body = {}, existing = null) {
  const status_payroll = body?.status_payroll
    ? normalizeEnum(body.status_payroll, STATUS_PAYROLL_VALUES, 'status_payroll')
    : String(existing?.status_payroll || 'DRAFT')
        .trim()
        .toUpperCase();

  return {
    status_payroll,
    finalized_at: existing?.finalized_at || null,
  };
}

async function resolveCreatePayload(body = {}) {
  const id_periode_payroll = normalizeRequiredId(body?.id_periode_payroll, 'id_periode_payroll');
  const id_user = normalizeRequiredId(body?.id_user, 'id_user');

  const [periode, user, profilPayroll] = await Promise.all([ensurePeriodeExists(id_periode_payroll), ensureUserExists(id_user), ensureProfilPayrollAktifExists(id_user)]);

  if (!periode) {
    return {
      error: NextResponse.json({ message: 'Periode payroll tidak ditemukan.' }, { status: 404 }),
    };
  }

  if (IMMUTABLE_PERIODE_STATUS.has(String(periode.status_periode || '').toUpperCase())) {
    return {
      error: NextResponse.json({ message: 'Periode payroll sudah final/terkunci dan tidak bisa menerima payroll baru.' }, { status: 409 }),
    };
  }

  if (!user) {
    return {
      error: NextResponse.json({ message: 'User tidak ditemukan atau sudah dihapus.' }, { status: 404 }),
    };
  }

  if (!profilPayroll) {
    return {
      error: NextResponse.json({ message: 'Profil payroll aktif untuk user ini belum tersedia.' }, { status: 404 }),
    };
  }

  const requestedJenisHubungan = body?.jenis_hubungan_kerja ? normalizeEnum(body.jenis_hubungan_kerja, JENIS_HUBUNGAN_KERJA_VALUES, 'jenis_hubungan_kerja') : '';

  // Snapshot awal payroll harus mengikuti profil payroll aktif di database.
  // Payload dari client bisa stale, terutama ketika memulihkan payroll yang sebelumnya di-soft delete.
  const tarifPajakTer = profilPayroll?.id_tarif_pajak_ter ? await ensureTarifPajakTerExists(profilPayroll.id_tarif_pajak_ter) : null;

  if (!tarifPajakTer) {
    return {
      error: NextResponse.json({ message: 'Tarif pajak TER untuk user ini belum tersedia.' }, { status: 404 }),
    };
  }

  const jenis_hubungan_kerja =
    requestedJenisHubungan ||
    String(profilPayroll?.jenis_hubungan_kerja || '')
      .trim()
      .toUpperCase();

  if (!jenis_hubungan_kerja || !JENIS_HUBUNGAN_KERJA_VALUES.has(jenis_hubungan_kerja)) {
    return {
      error: NextResponse.json(
        {
          message: `Jenis hubungan kerja tidak valid. Nilai yang diizinkan: ${Array.from(JENIS_HUBUNGAN_KERJA_VALUES).join(', ')}`,
        },
        { status: 400 },
      ),
    };
  }

  const gajiPokokSnapshot = parseNonNegativeDecimal(body?.gaji_pokok_snapshot ?? profilPayroll?.gaji_pokok ?? '0', 'gaji_pokok_snapshot');
  const persenTarifSnapshot = parseNonNegativeDecimal(tarifPajakTer.persen_tarif, 'persen_tarif_snapshot', { scale: 4 });

  const totals = resolveDraftDecimalStrings({
    ...body,
    total_pendapatan_bruto: body?.total_pendapatan_bruto ?? body?.total_bruto_kena_pajak ?? gajiPokokSnapshot,
  }, null, {
    persenTarifSnapshot,
  });

  const statusFields = normalizeStatusRelatedFields(body);

  return {
    payload: {
      id_periode_payroll,
      id_user,
      id_profil_payroll: profilPayroll.id_profil_payroll,
      id_tarif_pajak_ter: tarifPajakTer.id_tarif_pajak_ter,
      nama_karyawan: normalizeNullableString(body?.nama_karyawan, 'nama_karyawan', 255) || normalizeNullableString(body?.nama_karyawan_snapshot, 'nama_karyawan_snapshot', 255) || user.nama_pengguna,
      jenis_hubungan_kerja,
      kode_kategori_pajak_snapshot: String(tarifPajakTer.kode_kategori_pajak || ''),
      persen_tarif_snapshot: persenTarifSnapshot,
      penghasilan_dari_snapshot: parseNonNegativeDecimal(tarifPajakTer.penghasilan_dari, 'penghasilan_dari_snapshot'),
      penghasilan_sampai_snapshot: tarifPajakTer.penghasilan_sampai == null ? null : parseNonNegativeDecimal(tarifPajakTer.penghasilan_sampai, 'penghasilan_sampai_snapshot', { allowNull: true }),
      berlaku_mulai_tarif_snapshot: tarifPajakTer.berlaku_mulai,
      berlaku_sampai_tarif_snapshot: tarifPajakTer.berlaku_sampai,
      gaji_pokok_snapshot: gajiPokokSnapshot,
      bank_name: normalizeNullableString(body?.bank_name, 'bank_name', 50) || normalizeNullableString(body?.nama_bank_snapshot, 'nama_bank_snapshot', 50) || normalizeNullableString(user.jenis_bank, 'jenis_bank', 50) || null,
      bank_account:
        normalizeNullableString(body?.bank_account, 'bank_account', 50) || normalizeNullableString(body?.nomor_rekening_snapshot, 'nomor_rekening_snapshot', 50) || normalizeNullableString(user.nomor_rekening, 'nomor_rekening', 50) || null,
      issue_number: normalizeNullableString(body?.issue_number, 'issue_number', 100),
      issued_at: parseDateTime(body?.issued_at, 'issued_at'),
      company_name_snapshot: normalizeNullableString(body?.company_name_snapshot, 'company_name_snapshot', 255),
      catatan: normalizeNullableString(body?.catatan, 'catatan'),
      ...totals,
      ...statusFields,
      deleted_at: null,
    },
  };
}

function normalizeOptionalApprovalStatus(value, fieldName = 'status_approval') {
  if (value === undefined || value === null || value === '') return undefined;

  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!STATUS_APPROVAL_VALUES.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(STATUS_APPROVAL_VALUES).join(', ')}`);
  }

  return normalized;
}

export async function GET(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, VIEW_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10', 10), 1), 100);

    const search = String(searchParams.get('search') || '').trim();
    const id_periode_payroll = String(searchParams.get('id_periode_payroll') || '').trim();
    const id_user = String(searchParams.get('id_user') || '').trim();
    const id_profil_payroll = String(searchParams.get('id_profil_payroll') || '').trim();
    const id_tarif_pajak_ter = String(searchParams.get('id_tarif_pajak_ter') || '').trim();
    const periode_status = String(searchParams.get('periode_status') || '')
      .trim()
      .toUpperCase();
    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const status_payroll = searchParams.get('status_payroll') ? normalizeEnum(searchParams.get('status_payroll'), STATUS_PAYROLL_VALUES, 'status_payroll') : undefined;
    const status_approval = normalizeOptionalApprovalStatus(searchParams.get('status_approval'));

    if (periode_status && !new Set(['DRAFT', 'DIPROSES', 'DIREVIEW', 'FINAL', 'TERKUNCI']).has(periode_status)) {
      return NextResponse.json({ message: 'periode_status tidak valid.' }, { status: 400 });
    }

    const orderByParam = String(searchParams.get('orderBy') || 'created_at').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'created_at';
    const sort = String(searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_periode_payroll ? { id_periode_payroll } : {}),
      ...(id_user ? { id_user } : {}),
      ...(id_profil_payroll ? { id_profil_payroll } : {}),
      ...(id_tarif_pajak_ter ? { id_tarif_pajak_ter } : {}),
      ...(status_payroll ? { status_payroll } : {}),
      ...(status_approval ? { status_approval } : {}),
      ...(periode_status
        ? {
            periode: {
              is: {
                status_periode: periode_status,
              },
            },
          }
        : {}),
      ...(search ? { OR: buildSearchClauses(search) } : {}),
    };

    const [total, data] = await Promise.all([
      db.payrollKaryawan.count({ where }),
      db.payrollKaryawan.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data: data.map(enrichPayroll),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.startsWith('Field ') ||
        err.message.includes('tidak valid') ||
        err.message.includes('tanggal') ||
        err.message.includes('Payroll hanya dapat'))
    ) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('GET /api/admin/payroll-karyawan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await ensureAuth(req);
  if (auth instanceof NextResponse) return auth;

  const forbidden = guardRole(auth.actor, CREATE_ROLES);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const resolved = await resolveCreatePayload(body);

    if (resolved.error) return resolved.error;

    const approvalSteps = await resolveApprovalSteps(body?.approval_steps);
    const approvalState = deriveApprovalState(approvalSteps);

    ensureCanMarkPayrollAsPaid(resolved.payload.status_payroll, approvalState.status_approval);

    const existing = await db.payrollKaryawan.findFirst({
      where: {
        id_periode_payroll: resolved.payload.id_periode_payroll,
        id_user: resolved.payload.id_user,
      },
      select: {
        id_payroll_karyawan: true,
        deleted_at: true,
      },
    });

    if (existing && existing.deleted_at === null) {
      return NextResponse.json({ message: 'Payroll karyawan untuk user dan periode tersebut sudah ada.' }, { status: 409 });
    }

    if (existing && existing.deleted_at !== null) {
      const restored = await db.$transaction(async (tx) => {
        await replaceApprovalSteps(tx, existing.id_payroll_karyawan, approvalSteps);

        await tx.payrollKaryawan.update({
          where: { id_payroll_karyawan: existing.id_payroll_karyawan },
          data: {
            ...resolved.payload,
            status_approval: approvalState.status_approval,
            current_level_approval: approvalState.current_level_approval,
          },
        });

        return tx.payrollKaryawan.findUnique({
          where: { id_payroll_karyawan: existing.id_payroll_karyawan },
          select: buildSelect(),
        });
      });

      return NextResponse.json(
        {
          message: 'Payroll karyawan berhasil dipulihkan dan diperbarui.',
          data: enrichPayroll(restored),
        },
        { status: 200 },
      );
    }

    const created = await db.$transaction(async (tx) => {
      const payroll = await tx.payrollKaryawan.create({
        data: {
          ...resolved.payload,
          status_approval: approvalState.status_approval,
          current_level_approval: approvalState.current_level_approval,
        },
        select: {
          id_payroll_karyawan: true,
        },
      });

      await replaceApprovalSteps(tx, payroll.id_payroll_karyawan, approvalSteps);

      return tx.payrollKaryawan.findUnique({
        where: { id_payroll_karyawan: payroll.id_payroll_karyawan },
        select: buildSelect(),
      });
    });

    return NextResponse.json(
      {
        message: 'Payroll karyawan berhasil dibuat.',
        data: enrichPayroll(created),
      },
      { status: 201 },
    );
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Payroll karyawan untuk user dan periode tersebut sudah ada.' }, { status: 409 });
    }

    if (
      err instanceof Error &&
      (err.message.startsWith('Field ') ||
        err.message.includes('tidak valid') ||
        err.message.includes('tanggal') ||
        err.message.includes('Payroll hanya dapat'))
    ) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }

    console.error('POST /api/admin/payroll-karyawan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
