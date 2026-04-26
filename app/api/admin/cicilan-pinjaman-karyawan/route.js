import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { authenticateRequest } from '@/app/utils/auth/authUtils';
import { IMMUTABLE_PAYROLL_STATUS, IMMUTABLE_PERIODE_STATUS, recalculateLoanSnapshot, syncCicilanPayrollPosting } from './payrollPosting.shared';

const VIEW_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);
const CREATE_ROLES = new Set(['HR', 'DIREKTUR', 'SUPERADMIN']);

const STATUS_CICILAN_VALUES = new Set(['MENUNGGU', 'DIPOSTING', 'DIBAYAR', 'DILEWATI']);
const STATUS_PINJAMAN_VALUES = new Set(['DRAFT', 'AKTIF', 'LUNAS', 'DIBATALKAN']);

const ALLOWED_ORDER_BY = new Set(['created_at', 'updated_at', 'jatuh_tempo', 'nominal_tagihan', 'nominal_terbayar', 'status_cicilan', 'diposting_pada', 'dibayar_pada']);

const DECIMAL_SCALE = 2;

const normRole = (role) =>
  String(role || '')
    .trim()
    .toUpperCase();

function normalizeRequiredString(value, fieldName, maxLength = null) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

function normalizeNullableString(value, fieldName = 'string', maxLength = null) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

function normalizeOptionalId(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  return normalized;
}

function normalizeEnum(value, allowedValues, fieldName) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!allowedValues.has(normalized)) {
    throw new Error(`${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(allowedValues).join(', ')}`);
  }

  return normalized;
}

function hasDefinedField(input, fieldName) {
  return Object.prototype.hasOwnProperty.call(input, fieldName) && input[fieldName] !== undefined;
}

function stripLeadingZeros(numStr) {
  const stripped = numStr.replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

function decimalToScaledBigInt(value, scale) {
  const stringValue = String(value);
  const negative = stringValue.startsWith('-');
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = stripLeadingZeros(intPartRaw || '0');
  const fracPart = fracPartRaw.padEnd(scale, '0').slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);
  return negative ? -bigintValue : bigintValue;
}

function scaledBigIntToDecimalString(value, scale) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, '0');
  const integerPart = padded.slice(0, -scale) || '0';
  const fractionPart = padded.slice(-scale);

  return `${negative ? '-' : ''}${integerPart}.${fractionPart}`;
}

function normalizeDecimalString(value, fieldName, scale, options = {}) {
  const { allowNull = false, min = null, max = null } = options;

  if (value === undefined) return undefined;
  if (value === null || value === '') {
    if (allowNull) return null;
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const raw = String(value).trim().replace(',', '.');

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(`Field '${fieldName}' harus berupa angka desimal yang valid.`);
  }

  const [integerPartRaw, fractionPartRaw = ''] = raw.split('.');
  if (fractionPartRaw.length > scale) {
    throw new Error(`Field '${fieldName}' maksimal memiliki ${scale} angka desimal.`);
  }

  const negative = integerPartRaw.startsWith('-');
  const integerDigits = negative ? integerPartRaw.slice(1) : integerPartRaw;
  const normalizedInteger = stripLeadingZeros(integerDigits || '0');
  const normalizedFraction = fractionPartRaw.padEnd(scale, '0');

  const normalized = `${negative ? '-' : ''}${normalizedInteger}.${normalizedFraction}`;
  const scaledValue = decimalToScaledBigInt(normalized, scale);

  if (min !== null && scaledValue < decimalToScaledBigInt(min, scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`);
  }

  if (max !== null && scaledValue > decimalToScaledBigInt(max, scale)) {
    throw new Error(`Field '${fieldName}' tidak boleh lebih besar dari ${max}.`);
  }

  return normalized;
}

function parseDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal yang valid.`);
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function parseRequiredDateOnly(value, fieldName) {
  const parsed = parseDateOnly(value, fieldName);
  if (!parsed) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  return parsed;
}

function parseDateTime(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Field '${fieldName}' harus berupa tanggal/waktu yang valid.`);
  }

  return parsed;
}

function toDateOnlyComparable(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())).getTime();
}

async function ensureAuth(req) {
  const auth = req.headers.get('authorization') || '';

  if (auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAuthToken(auth.slice(7));
      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: normRole(payload?.role),
          source: 'bearer',
        },
      };
    } catch (_) {
      // fallback ke session
    }
  }

  const sessionOrRes = await authenticateRequest();
  if (sessionOrRes instanceof NextResponse) return sessionOrRes;

  return {
    actor: {
      id: sessionOrRes?.user?.id || sessionOrRes?.user?.id_user,
      role: normRole(sessionOrRes?.user?.role),
      source: 'session',
    },
  };
}

function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json({ message: 'Forbidden: Anda tidak memiliki akses ke resource ini.' }, { status: 403 });
  }

  return null;
}

function buildSelect() {
  return {
    id_cicilan_pinjaman_karyawan: true,
    id_pinjaman_karyawan: true,
    id_payroll_karyawan: true,
    jatuh_tempo: true,
    nominal_tagihan: true,
    nominal_terbayar: true,
    status_cicilan: true,
    diposting_pada: true,
    dibayar_pada: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    pinjaman_karyawan: {
      select: {
        id_pinjaman_karyawan: true,
        id_user: true,
        nama_pinjaman: true,
        nominal_pinjaman: true,
        tenor_bulan: true,
        sisa_saldo: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_pinjaman: true,
        deleted_at: true,
        user: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
            nomor_induk_karyawan: true,
            status_kerja: true,
            deleted_at: true,
            departement: {
              select: {
                id_departement: true,
                nama_departement: true,
              },
            },
            jabatan: {
              select: {
                id_jabatan: true,
                nama_jabatan: true,
              },
            },
          },
        },
      },
    },
    payroll_karyawan: {
      select: {
        id_payroll_karyawan: true,
        id_user: true,
        status_payroll: true,
        finalized_at: true,
        deleted_at: true,
        periode: {
          select: {
            id_periode_payroll: true,
            tahun: true,
            bulan: true,
            tanggal_mulai: true,
            tanggal_selesai: true,
            status_periode: true,
          },
        },
      },
    },
  };
}

function getNominalCicilanDasar(pinjaman) {
  const tenorBulan = Number(pinjaman?.tenor_bulan);

  if (!Number.isInteger(tenorBulan) || tenorBulan <= 0) {
    throw new Error("Field 'tenor_bulan' pada pinjaman harus berupa bilangan bulat lebih besar dari 0.");
  }

  const totalPinjaman = decimalToScaledBigInt(String(pinjaman.nominal_pinjaman), DECIMAL_SCALE);

  if (totalPinjaman <= 0n) {
    throw new Error("Field 'nominal_pinjaman' pada pinjaman harus lebih besar dari 0.");
  }

  const nominalCicilan = totalPinjaman / BigInt(tenorBulan);

  if (nominalCicilan <= 0n) {
    throw new Error("Field 'tenor_bulan' terlalu besar untuk 'nominal_pinjaman'.");
  }

  return nominalCicilan;
}

function enrichPinjamanSnapshot(pinjaman) {
  if (!pinjaman) return pinjaman;

  let nominalCicilan = null;

  try {
    nominalCicilan = scaledBigIntToDecimalString(getNominalCicilanDasar(pinjaman), DECIMAL_SCALE);
  } catch (_) {
    nominalCicilan = null;
  }

  return {
    ...pinjaman,
    nominal_cicilan: nominalCicilan,
  };
}

function enrichCicilan(data) {
  if (!data) return data;

  const pinjaman = enrichPinjamanSnapshot(data.pinjaman_karyawan);
  const payrollStatus = String(data.payroll_karyawan?.status_payroll || '').toUpperCase();
  const periodeStatus = String(data.payroll_karyawan?.periode?.status_periode || '').toUpperCase();
  const payrollPaid = payrollStatus === 'DIBAYAR';
  const isPaid = data.status_cicilan === 'DIBAYAR';
  const payrollImmutable =
    Boolean(data.payroll_karyawan?.deleted_at) ||
    IMMUTABLE_PAYROLL_STATUS.has(payrollStatus) ||
    IMMUTABLE_PERIODE_STATUS.has(periodeStatus);

  return {
    ...data,
    pinjaman_karyawan: pinjaman,
    business_state: {
      linked_payroll: Boolean(data.id_payroll_karyawan),
      payroll_paid: payrollPaid,
      payroll_immutable: payrollImmutable,
      sudah_dibayar: isPaid,
      bisa_posting_payroll: !Boolean(data.deleted_at) && !Boolean(data.id_payroll_karyawan) && !isPaid && ['MENUNGGU', 'DILEWATI'].includes(String(data.status_cicilan || '').toUpperCase()),
      bisa_diubah: !Boolean(data.deleted_at) && !payrollImmutable && !isPaid,
      bisa_dihapus: !Boolean(data.deleted_at) && !payrollImmutable && !isPaid,
    },
  };
}

function validateDateWithinLoan(jatuh_tempo, pinjaman) {
  if (toDateOnlyComparable(jatuh_tempo) < toDateOnlyComparable(pinjaman.tanggal_mulai)) {
    throw new Error("Field 'jatuh_tempo' tidak boleh lebih kecil dari 'tanggal_mulai' pinjaman.");
  }

  if (pinjaman.tanggal_selesai && toDateOnlyComparable(jatuh_tempo) > toDateOnlyComparable(pinjaman.tanggal_selesai)) {
    throw new Error("Field 'jatuh_tempo' tidak boleh lebih besar dari 'tanggal_selesai' pinjaman.");
  }
}

function validateLifecycleState({ nominal_tagihan, nominal_terbayar, status_cicilan, id_payroll_karyawan, diposting_pada, dibayar_pada, payroll }) {
  const nominalTagihan = decimalToScaledBigInt(nominal_tagihan, DECIMAL_SCALE);
  const nominalTerbayar = decimalToScaledBigInt(nominal_terbayar, DECIMAL_SCALE);

  if (nominalTagihan <= 0n) {
    throw new Error("Field 'nominal_tagihan' harus lebih besar dari 0.");
  }

  if (nominalTerbayar < 0n) {
    throw new Error("Field 'nominal_terbayar' tidak boleh bernilai negatif.");
  }

  if (nominalTerbayar > nominalTagihan) {
    throw new Error("Field 'nominal_terbayar' tidak boleh lebih besar dari 'nominal_tagihan'.");
  }

  if (status_cicilan === 'MENUNGGU') {
    if (id_payroll_karyawan) {
      throw new Error("Status cicilan 'MENUNGGU' tidak boleh memiliki 'id_payroll_karyawan'.");
    }
    if (diposting_pada) {
      throw new Error("Status cicilan 'MENUNGGU' tidak boleh memiliki 'diposting_pada'.");
    }
    if (dibayar_pada) {
      throw new Error("Status cicilan 'MENUNGGU' tidak boleh memiliki 'dibayar_pada'.");
    }
    if (nominalTerbayar !== 0n) {
      throw new Error("Status cicilan 'MENUNGGU' mensyaratkan 'nominal_terbayar' bernilai 0.");
    }
  }

  if (status_cicilan === 'DILEWATI') {
    if (id_payroll_karyawan) {
      throw new Error("Status cicilan 'DILEWATI' tidak boleh memiliki 'id_payroll_karyawan'.");
    }
    if (diposting_pada) {
      throw new Error("Status cicilan 'DILEWATI' tidak boleh memiliki 'diposting_pada'.");
    }
    if (dibayar_pada) {
      throw new Error("Status cicilan 'DILEWATI' tidak boleh memiliki 'dibayar_pada'.");
    }
    if (nominalTerbayar !== 0n) {
      throw new Error("Status cicilan 'DILEWATI' mensyaratkan 'nominal_terbayar' bernilai 0.");
    }
  }

  if (status_cicilan === 'DIPOSTING') {
    if (!id_payroll_karyawan) {
      throw new Error("Status cicilan 'DIPOSTING' mensyaratkan field 'id_payroll_karyawan' terisi.");
    }
    if (!diposting_pada) {
      throw new Error("Status cicilan 'DIPOSTING' mensyaratkan field 'diposting_pada' terisi.");
    }
    if (!dibayar_pada) {
      throw new Error("Status cicilan 'DIPOSTING' mensyaratkan field 'dibayar_pada' terisi.");
    }
    if (nominalTerbayar !== nominalTagihan) {
      throw new Error("Status cicilan 'DIPOSTING' mensyaratkan 'nominal_terbayar' sama dengan 'nominal_tagihan'.");
    }
    if (payroll?.status_payroll === 'DIBAYAR') {
      throw new Error("Payroll yang dipilih sudah berstatus 'DIBAYAR'. Gunakan status cicilan 'DIBAYAR'.");
    }
  }

  if (status_cicilan === 'DIBAYAR') {
    if (!id_payroll_karyawan) {
      throw new Error("Status cicilan 'DIBAYAR' hanya boleh digunakan setelah cicilan diposting ke payroll.");
    }
    if (!dibayar_pada) {
      throw new Error("Status cicilan 'DIBAYAR' mensyaratkan field 'dibayar_pada' terisi.");
    }
    if (!diposting_pada) {
      throw new Error("Status cicilan 'DIBAYAR' yang terhubung payroll mensyaratkan field 'diposting_pada' terisi.");
    }
    if (nominalTerbayar !== nominalTagihan) {
      throw new Error("Status cicilan 'DIBAYAR' mensyaratkan 'nominal_terbayar' sama dengan 'nominal_tagihan'.");
    }
    if (payroll?.status_payroll !== 'DIBAYAR') {
      throw new Error("Cicilan yang terhubung payroll hanya boleh berstatus 'DIBAYAR' bila payroll juga berstatus 'DIBAYAR'.");
    }
  }
}

async function validateInstallmentUniqueness(tx, { id_pinjaman_karyawan, jatuh_tempo, currentId = null }) {
  const duplicate = await tx.cicilanPinjamanKaryawan.findFirst({
    where: {
      id_pinjaman_karyawan,
      jatuh_tempo,
      deleted_at: null,
      ...(currentId ? { id_cicilan_pinjaman_karyawan: { not: currentId } } : {}),
    },
    select: {
      id_cicilan_pinjaman_karyawan: true,
    },
  });

  if (duplicate) {
    throw new Error('Sudah ada cicilan aktif dengan jatuh tempo yang sama untuk pinjaman ini.');
  }
}

async function validateInstallmentQuota(tx, { id_pinjaman_karyawan, nominal_tagihan, status_cicilan, nominal_pinjaman, currentId = null }) {
  const summary = await tx.cicilanPinjamanKaryawan.aggregate({
    where: {
      id_pinjaman_karyawan,
      deleted_at: null,
      status_cicilan: { not: 'DILEWATI' },
      ...(currentId ? { id_cicilan_pinjaman_karyawan: { not: currentId } } : {}),
    },
    _sum: {
      nominal_tagihan: true,
    },
  });

  const existingTotal = summary._sum.nominal_tagihan ? String(summary._sum.nominal_tagihan) : '0.00';
  const projectedTotal = decimalToScaledBigInt(existingTotal, DECIMAL_SCALE) + (status_cicilan === 'DILEWATI' ? 0n : decimalToScaledBigInt(nominal_tagihan, DECIMAL_SCALE));
  const loanAmount = decimalToScaledBigInt(String(nominal_pinjaman), DECIMAL_SCALE);

  if (projectedTotal > loanAmount) {
    throw new Error("Total 'nominal_tagihan' cicilan aktif melebihi 'nominal_pinjaman'.");
  }
}

async function validatePaidQuota(tx, { id_pinjaman_karyawan, nominal_terbayar, nominal_pinjaman, currentId = null }) {
  const summary = await tx.cicilanPinjamanKaryawan.aggregate({
    where: {
      id_pinjaman_karyawan,
      deleted_at: null,
      ...(currentId ? { id_cicilan_pinjaman_karyawan: { not: currentId } } : {}),
    },
    _sum: {
      nominal_terbayar: true,
    },
  });

  const existingTotal = summary._sum.nominal_terbayar ? String(summary._sum.nominal_terbayar) : '0.00';
  const projectedTotal = decimalToScaledBigInt(existingTotal, DECIMAL_SCALE) + decimalToScaledBigInt(nominal_terbayar, DECIMAL_SCALE);
  const loanAmount = decimalToScaledBigInt(String(nominal_pinjaman), DECIMAL_SCALE);

  if (projectedTotal > loanAmount) {
    throw new Error("Akumulasi 'nominal_terbayar' cicilan melebihi 'nominal_pinjaman'.");
  }
}

async function resolveDefaultNominalTagihan(tx, { pinjaman, currentId = null }) {
  const nominalDasar = getNominalCicilanDasar(pinjaman);
  const tenorBulan = Number(pinjaman.tenor_bulan);
  const summary = await tx.cicilanPinjamanKaryawan.aggregate({
    where: {
      id_pinjaman_karyawan: pinjaman.id_pinjaman_karyawan,
      deleted_at: null,
      status_cicilan: { not: 'DILEWATI' },
      ...(currentId ? { id_cicilan_pinjaman_karyawan: { not: currentId } } : {}),
    },
    _sum: {
      nominal_tagihan: true,
    },
    _count: {
      id_cicilan_pinjaman_karyawan: true,
    },
  });

  const existingTotal = summary._sum.nominal_tagihan ? String(summary._sum.nominal_tagihan) : '0.00';
  const existingCount = Number(summary._count.id_cicilan_pinjaman_karyawan || 0);
  const remaining = decimalToScaledBigInt(String(pinjaman.nominal_pinjaman), DECIMAL_SCALE) - decimalToScaledBigInt(existingTotal, DECIMAL_SCALE);
  const nominalTagihan = existingCount >= tenorBulan - 1 && remaining > 0n ? remaining : nominalDasar;

  return scaledBigIntToDecimalString(nominalTagihan, DECIMAL_SCALE);
}

async function resolveBusinessState(tx, input, existing = null) {
  const id_pinjaman_karyawan = hasDefinedField(input, 'id_pinjaman_karyawan') ? input.id_pinjaman_karyawan : existing?.id_pinjaman_karyawan;

  if (!id_pinjaman_karyawan) {
    throw new Error("Field 'id_pinjaman_karyawan' wajib diisi.");
  }

  const jatuh_tempo = hasDefinedField(input, 'jatuh_tempo') ? input.jatuh_tempo : existing?.jatuh_tempo;
  if (!jatuh_tempo) {
    throw new Error("Field 'jatuh_tempo' wajib diisi.");
  }

  const [pinjaman, defaultStatusSeed] = await Promise.all([
    tx.pinjamanKaryawan.findUnique({
      where: { id_pinjaman_karyawan },
      select: {
        id_pinjaman_karyawan: true,
        id_user: true,
        nama_pinjaman: true,
        nominal_pinjaman: true,
        tenor_bulan: true,
        sisa_saldo: true,
        tanggal_mulai: true,
        tanggal_selesai: true,
        status_pinjaman: true,
        deleted_at: true,
      },
    }),
    Promise.resolve(
      hasDefinedField(input, 'status_cicilan')
        ? input.status_cicilan
        : existing?.status_cicilan
          ? existing.status_cicilan
          : null,
    ),
  ]);

  if (!pinjaman) {
    throw new Error('Pinjaman karyawan tidak ditemukan.');
  }

  if (pinjaman.deleted_at) {
    throw new Error('Pinjaman karyawan yang dipilih sudah dihapus.');
  }

  if (!STATUS_PINJAMAN_VALUES.has(String(pinjaman.status_pinjaman))) {
    throw new Error('Status pinjaman pada data induk tidak valid.');
  }

  if (pinjaman.status_pinjaman === 'DRAFT') {
    throw new Error('Pinjaman karyawan yang dipilih masih berstatus draft dan belum dapat memiliki cicilan.');
  }

  if (pinjaman.status_pinjaman === 'DIBATALKAN') {
    throw new Error('Pinjaman karyawan yang dipilih sudah dibatalkan.');
  }

  if (pinjaman.status_pinjaman === 'LUNAS' && (!existing || id_pinjaman_karyawan !== existing.id_pinjaman_karyawan)) {
    throw new Error('Pinjaman karyawan yang dipilih sudah lunas.');
  }

  validateDateWithinLoan(jatuh_tempo, pinjaman);

  const id_payroll_karyawan = hasDefinedField(input, 'id_payroll_karyawan') ? input.id_payroll_karyawan : (existing?.id_payroll_karyawan ?? null);

  const payroll = id_payroll_karyawan
    ? await tx.payrollKaryawan.findUnique({
        where: { id_payroll_karyawan },
        select: {
          id_payroll_karyawan: true,
          id_user: true,
          status_payroll: true,
          finalized_at: true,
          created_at: true,
          deleted_at: true,
          periode: {
            select: {
              id_periode_payroll: true,
              tanggal_mulai: true,
              tanggal_selesai: true,
              status_periode: true,
            },
          },
        },
      })
    : null;

  if (id_payroll_karyawan && !payroll) {
    throw new Error('Payroll karyawan tidak ditemukan.');
  }

  if (payroll?.deleted_at) {
    throw new Error('Payroll karyawan yang dipilih sudah dihapus.');
  }

  if (payroll && payroll.id_user !== pinjaman.id_user) {
    throw new Error('Payroll karyawan yang dipilih harus milik user yang sama dengan pinjaman.');
  }

  if (payroll && IMMUTABLE_PAYROLL_STATUS.has(String(payroll.status_payroll || '').toUpperCase())) {
    throw new Error('Payroll karyawan tujuan sudah final/disetujui dan tidak bisa menerima posting cicilan.');
  }

  if (payroll?.periode && IMMUTABLE_PERIODE_STATUS.has(String(payroll.periode.status_periode || '').toUpperCase())) {
    throw new Error('Periode payroll yang terkait dengan payroll karyawan sudah terkunci.');
  }

  const defaultNominalTagihan = hasDefinedField(input, 'nominal_tagihan') || (existing?.nominal_tagihan !== undefined && existing?.nominal_tagihan !== null)
    ? null
    : await resolveDefaultNominalTagihan(tx, {
        pinjaman,
        currentId: existing?.id_cicilan_pinjaman_karyawan || null,
      });

  const nominal_tagihan = hasDefinedField(input, 'nominal_tagihan')
    ? input.nominal_tagihan
    : existing?.nominal_tagihan !== undefined && existing?.nominal_tagihan !== null
      ? String(existing.nominal_tagihan)
      : defaultNominalTagihan;

  const status_cicilan = defaultStatusSeed ?? (id_payroll_karyawan ? (payroll?.status_payroll === 'DIBAYAR' ? 'DIBAYAR' : 'DIPOSTING') : 'MENUNGGU');

  let nominal_terbayar = hasDefinedField(input, 'nominal_terbayar')
    ? input.nominal_terbayar
    : existing?.nominal_terbayar !== undefined && existing?.nominal_terbayar !== null
      ? String(existing.nominal_terbayar)
      : '0.00';

  let diposting_pada = hasDefinedField(input, 'diposting_pada') ? input.diposting_pada : (existing?.diposting_pada ?? null);
  let dibayar_pada = hasDefinedField(input, 'dibayar_pada') ? input.dibayar_pada : (existing?.dibayar_pada ?? null);

  if (status_cicilan === 'DIPOSTING') {
    const postedAt = diposting_pada || new Date();
    nominal_terbayar = nominal_tagihan;
    diposting_pada = postedAt;
    dibayar_pada = dibayar_pada || postedAt;
  }

  if (status_cicilan === 'DIBAYAR') {
    nominal_terbayar = nominal_tagihan;
    if (id_payroll_karyawan && !diposting_pada) {
      diposting_pada = payroll?.created_at || new Date();
    }
    if (!dibayar_pada) {
      dibayar_pada = payroll?.finalized_at || new Date();
    }
  }

  validateLifecycleState({
    nominal_tagihan,
    nominal_terbayar,
    status_cicilan,
    id_payroll_karyawan,
    diposting_pada,
    dibayar_pada,
    payroll,
  });

  await validateInstallmentUniqueness(tx, {
    id_pinjaman_karyawan,
    jatuh_tempo,
    currentId: existing?.id_cicilan_pinjaman_karyawan || null,
  });

  await validateInstallmentQuota(tx, {
    id_pinjaman_karyawan,
    nominal_tagihan,
    status_cicilan,
    nominal_pinjaman: pinjaman.nominal_pinjaman,
    currentId: existing?.id_cicilan_pinjaman_karyawan || null,
  });

  await validatePaidQuota(tx, {
    id_pinjaman_karyawan,
    nominal_terbayar,
    nominal_pinjaman: pinjaman.nominal_pinjaman,
    currentId: existing?.id_cicilan_pinjaman_karyawan || null,
  });

  return {
    relationState: {
      pinjaman,
      payroll,
    },
    payload: {
      id_pinjaman_karyawan,
      id_payroll_karyawan,
      jatuh_tempo,
      nominal_tagihan,
      nominal_terbayar,
      status_cicilan,
      diposting_pada,
      dibayar_pada,
    },
  };
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

    const search = (searchParams.get('search') || '').trim();
    const id_pinjaman_karyawan = (searchParams.get('id_pinjaman_karyawan') || '').trim();
    const id_payroll_karyawan = (searchParams.get('id_payroll_karyawan') || '').trim();

    const includeDeleted = ['1', 'true'].includes((searchParams.get('includeDeleted') || '').toLowerCase());
    const deletedOnly = ['1', 'true'].includes((searchParams.get('deletedOnly') || '').toLowerCase());

    const status_cicilan = searchParams.get('status_cicilan') ? normalizeEnum(searchParams.get('status_cicilan'), STATUS_CICILAN_VALUES, 'status_cicilan') : undefined;

    const orderByParam = (searchParams.get('orderBy') || 'jatuh_tempo').trim();
    const orderBy = ALLOWED_ORDER_BY.has(orderByParam) ? orderByParam : 'jatuh_tempo';
    const sort = (searchParams.get('sort') || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    const jatuhTempoFrom = parseDateOnly(searchParams.get('jatuhTempoFrom'), 'jatuhTempoFrom');
    const jatuhTempoTo = parseDateOnly(searchParams.get('jatuhTempoTo'), 'jatuhTempoTo');
    const dipostingFrom = parseDateTime(searchParams.get('dipostingFrom'), 'dipostingFrom');
    const dipostingTo = parseDateTime(searchParams.get('dipostingTo'), 'dipostingTo');
    const dibayarFrom = parseDateTime(searchParams.get('dibayarFrom'), 'dibayarFrom');
    const dibayarTo = parseDateTime(searchParams.get('dibayarTo'), 'dibayarTo');

    if (jatuhTempoFrom && jatuhTempoTo && jatuhTempoFrom > jatuhTempoTo) {
      return NextResponse.json({ message: 'Parameter jatuhTempoFrom tidak boleh lebih besar dari jatuhTempoTo.' }, { status: 400 });
    }

    if (dipostingFrom && dipostingTo && dipostingFrom > dipostingTo) {
      return NextResponse.json({ message: 'Parameter dipostingFrom tidak boleh lebih besar dari dipostingTo.' }, { status: 400 });
    }

    if (dibayarFrom && dibayarTo && dibayarFrom > dibayarTo) {
      return NextResponse.json({ message: 'Parameter dibayarFrom tidak boleh lebih besar dari dibayarTo.' }, { status: 400 });
    }

    const where = {
      ...(deletedOnly ? { deleted_at: { not: null } } : {}),
      ...(!includeDeleted && !deletedOnly ? { deleted_at: null } : {}),
      ...(id_pinjaman_karyawan ? { id_pinjaman_karyawan } : {}),
      ...(id_payroll_karyawan ? { id_payroll_karyawan } : {}),
      ...(status_cicilan ? { status_cicilan } : {}),
      ...(jatuhTempoFrom || jatuhTempoTo
        ? {
            jatuh_tempo: {
              ...(jatuhTempoFrom ? { gte: jatuhTempoFrom } : {}),
              ...(jatuhTempoTo ? { lte: jatuhTempoTo } : {}),
            },
          }
        : {}),
      ...(dipostingFrom || dipostingTo
        ? {
            diposting_pada: {
              ...(dipostingFrom ? { gte: dipostingFrom } : {}),
              ...(dipostingTo ? { lte: dipostingTo } : {}),
            },
          }
        : {}),
      ...(dibayarFrom || dibayarTo
        ? {
            dibayar_pada: {
              ...(dibayarFrom ? { gte: dibayarFrom } : {}),
              ...(dibayarTo ? { lte: dibayarTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { catatan: { contains: search } },
              { pinjaman_karyawan: { is: { nama_pinjaman: { contains: search } } } },
              { pinjaman_karyawan: { is: { user: { is: { nama_pengguna: { contains: search } } } } } },
              { pinjaman_karyawan: { is: { user: { is: { email: { contains: search } } } } } },
              { pinjaman_karyawan: { is: { user: { is: { nomor_induk_karyawan: { contains: search } } } } } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      db.cicilanPinjamanKaryawan.count({ where }),
      db.cicilanPinjamanKaryawan.findMany({
        where,
        orderBy: { [orderBy]: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: buildSelect(),
      }),
    ]);

    return NextResponse.json({
      data: data.map(enrichCicilan),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.startsWith('Field ') || err.message.includes('status_cicilan') || err.message.includes('tanggal') || err.message.includes('waktu')) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('GET /api/admin/cicilan-pinjaman-karyawan error:', err);
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

    const sanitizedInput = {
      id_pinjaman_karyawan: normalizeRequiredString(body?.id_pinjaman_karyawan, 'id_pinjaman_karyawan', 36),
      id_payroll_karyawan: normalizeOptionalId(body?.id_payroll_karyawan),
      jatuh_tempo: parseRequiredDateOnly(body?.jatuh_tempo, 'jatuh_tempo'),
      nominal_tagihan: body?.nominal_tagihan === undefined ? undefined : normalizeDecimalString(body?.nominal_tagihan, 'nominal_tagihan', DECIMAL_SCALE, { min: '0' }),
      nominal_terbayar: body?.nominal_terbayar === undefined ? undefined : normalizeDecimalString(body?.nominal_terbayar, 'nominal_terbayar', DECIMAL_SCALE, { min: '0' }),
      status_cicilan: body?.status_cicilan === undefined ? undefined : normalizeEnum(body?.status_cicilan, STATUS_CICILAN_VALUES, 'status_cicilan'),
      diposting_pada: body?.diposting_pada === undefined ? undefined : parseDateTime(body?.diposting_pada, 'diposting_pada'),
      dibayar_pada: body?.dibayar_pada === undefined ? undefined : parseDateTime(body?.dibayar_pada, 'dibayar_pada'),
      catatan: normalizeNullableString(body?.catatan, 'catatan'),
    };

    const created = await db.$transaction(async (tx) => {
      const resolved = await resolveBusinessState(tx, sanitizedInput);

      const record = await tx.cicilanPinjamanKaryawan.create({
        data: {
          ...resolved.payload,
          catatan: sanitizedInput.catatan,
        },
        select: buildSelect(),
      });

      const loanSnapshot = await recalculateLoanSnapshot(tx, resolved.payload.id_pinjaman_karyawan);
      const postingSummary = await syncCicilanPayrollPosting(tx, record, auth.actor);

      return {
        ...enrichCicilan(record),
        loan_snapshot: loanSnapshot,
        posting_summary: postingSummary,
      };
    });

    return NextResponse.json(
      {
        message: 'Cicilan pinjaman karyawan berhasil dibuat.',
        data: created,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ message: 'Payload JSON tidak valid.' }, { status: 400 });
    }

    if (err instanceof Error) {
      if (
        err.message.startsWith('Field ') ||
        err.message.includes('pinjaman') ||
        err.message.includes('payroll') ||
        err.message.includes('cicilan') ||
        err.message.includes('nominal_') ||
        err.message.includes('jatuh_tempo') ||
        err.message.includes('tanggal') ||
        err.message.includes('waktu') ||
        err.message.includes('Akumulasi') ||
        err.message.includes('Total ')
      ) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
    }

    console.error('POST /api/admin/cicilan-pinjaman-karyawan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
