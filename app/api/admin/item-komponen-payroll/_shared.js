import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { authenticateRequest } from "@/app/utils/auth/authUtils";
import { verifyAuthToken } from "@/lib/jwt";
import db from "@/lib/prisma";

export const VIEW_ROLES = new Set(["HR", "DIREKTUR", "SUPERADMIN"]);
export const CREATE_ROLES = new Set(["HR", "DIREKTUR", "SUPERADMIN"]);
export const EDIT_ROLES = new Set(["HR", "DIREKTUR", "SUPERADMIN"]);
export const DELETE_ROLES = new Set(["HR", "DIREKTUR", "SUPERADMIN"]);

export const DECIMAL_SCALE = 2;
export const DECIMAL_PRECISION = 15;
export const DECIMAL_MAX_INTEGER_DIGITS = DECIMAL_PRECISION - DECIMAL_SCALE;

export const ARAH_KOMPONEN_VALUES = new Set(["PEMASUKAN", "POTONGAN"]);
export const STATUS_PAYROLL_VALUES = new Set([
  "DRAFT",
  "TERSIMPAN",
  "DISETUJUI",
  "DIBAYAR",
]);
export const STATUS_PERIODE_VALUES = new Set([
  "DRAFT",
  "DIPROSES",
  "DIREVIEW",
  "FINAL",
  "TERKUNCI",
]);

export const IMMUTABLE_PAYROLL_STATUS = new Set(["DISETUJUI", "DIBAYAR"]);
export const IMMUTABLE_PERIODE_STATUS = new Set(["FINAL", "TERKUNCI"]);

export const ALLOWED_ORDER_BY = new Set([
  "created_at",
  "updated_at",
  "kunci_idempoten",
  "nama_komponen",
  "tipe_komponen",
  "arah_komponen",
  "nominal",
  "kena_pajak",
  "urutan_tampil",
]);

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export function normRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

export function createHttpError(statusCode, message, extras = {}) {
  const err = new Error(message);
  err.statusCode = statusCode;
  Object.assign(err, extras);
  return err;
}

export function normalizeRequiredString(value, fieldName, maxLength = null) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

export function normalizeNullableString(
  value,
  fieldName = "string",
  maxLength = null,
) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();

  if (!normalized) return null;

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized;
}

export function normalizeOptionalId(value, fieldName = "id") {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();

  if (!normalized) return null;

  if (normalized.length > 36) {
    throw new Error(`Field '${fieldName}' maksimal 36 karakter.`);
  }

  return normalized;
}

export function normalizeBoolean(value, fieldName = "boolean") {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "ya", "yes"].includes(normalized)) return true;
    if (["false", "0", "tidak", "no"].includes(normalized)) return false;
  }

  throw new Error(`Field '${fieldName}' harus bernilai boolean.`);
}

export function normalizeEnum(value, allowedValues, fieldName) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error(`Field '${fieldName}' wajib diisi.`);
  }

  if (!allowedValues.has(normalized)) {
    throw new Error(
      `${fieldName} tidak valid. Nilai yang diizinkan: ${Array.from(allowedValues).join(", ")}`,
    );
  }

  return normalized;
}

export function normalizeOptionalUpperString(
  value,
  fieldName,
  maxLength = null,
) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = String(value).trim();

  if (!normalized) return null;

  if (maxLength && normalized.length > maxLength) {
    throw new Error(`Field '${fieldName}' maksimal ${maxLength} karakter.`);
  }

  return normalized.toUpperCase();
}

export function normalizeOptionalInt(value, fieldName, options = {}) {
  const { min = null, max = null } = options;

  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const normalized = Number(value);

  if (!Number.isInteger(normalized)) {
    throw new Error(`Field '${fieldName}' harus berupa bilangan bulat.`);
  }

  if (min !== null && normalized < min) {
    throw new Error(
      `Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`,
    );
  }

  if (max !== null && normalized > max) {
    throw new Error(
      `Field '${fieldName}' tidak boleh lebih besar dari ${max}.`,
    );
  }

  return normalized;
}

function stripLeadingZeros(numStr) {
  const stripped = String(numStr || "0").replace(/^0+(?=\d)/, "");
  return stripped || "0";
}

export function decimalToScaledBigInt(value, scale = DECIMAL_SCALE) {
  const stringValue = String(value);
  const negative = stringValue.startsWith("-");
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ""] = unsigned.split(".");
  const intPart = stripLeadingZeros(intPartRaw || "0");
  const fracPart = fracPartRaw.padEnd(scale, "0").slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);

  return negative ? -bigintValue : bigintValue;
}

export function scaledBigIntToDecimalString(value, scale = DECIMAL_SCALE) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, "0");
  const integerPart = padded.slice(0, -scale) || "0";
  const fractionPart = padded.slice(-scale);

  return `${negative ? "-" : ""}${integerPart}.${fractionPart}`;
}

export function normalizeDecimalString(
  value,
  fieldName,
  scale = DECIMAL_SCALE,
  options = {},
) {
  const {
    allowNull = false,
    min = null,
    max = null,
    maxIntegerDigits = null,
  } = options;

  if (value === undefined) return undefined;
  if (value === null || value === "") {
    if (allowNull) return null;
    throw new Error(`Field '${fieldName}' tidak boleh kosong.`);
  }

  const raw = String(value).trim().replace(",", ".");

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    throw new Error(
      `Field '${fieldName}' harus berupa angka desimal yang valid.`,
    );
  }

  const [integerPartRaw, fractionPartRaw = ""] = raw.split(".");

  if (fractionPartRaw.length > scale) {
    throw new Error(
      `Field '${fieldName}' maksimal memiliki ${scale} angka desimal.`,
    );
  }

  const negative = integerPartRaw.startsWith("-");
  const integerDigits = negative ? integerPartRaw.slice(1) : integerPartRaw;
  const normalizedInteger = stripLeadingZeros(integerDigits || "0");
  const normalizedFraction = fractionPartRaw.padEnd(scale, "0");

  if (
    maxIntegerDigits !== null &&
    normalizedInteger.length > maxIntegerDigits
  ) {
    throw new Error(
      `Field '${fieldName}' maksimal memiliki ${maxIntegerDigits} digit sebelum desimal sesuai schema Decimal(${maxIntegerDigits + scale}, ${scale}).`,
    );
  }

  const normalized = `${negative ? "-" : ""}${normalizedInteger}.${normalizedFraction}`;
  const scaledValue = decimalToScaledBigInt(normalized, scale);

  if (min !== null && scaledValue < decimalToScaledBigInt(min, scale)) {
    throw new Error(
      `Field '${fieldName}' tidak boleh lebih kecil dari ${min}.`,
    );
  }

  if (max !== null && scaledValue > decimalToScaledBigInt(max, scale)) {
    throw new Error(
      `Field '${fieldName}' tidak boleh lebih besar dari ${max}.`,
    );
  }

  return normalized;
}

export async function ensureAuth(req) {
  const auth = req.headers.get("authorization") || "";

  if (auth.startsWith("Bearer ")) {
    try {
      const payload = verifyAuthToken(auth.slice(7));

      return {
        actor: {
          id: payload?.sub || payload?.id_user || payload?.userId,
          role: normRole(payload?.role),
          source: "bearer",
        },
      };
    } catch (_) {
      // fallback ke session
    }
  }

  const sessionOrRes = await authenticateRequest();

  if (sessionOrRes instanceof NextResponse) {
    return sessionOrRes;
  }

  return {
    actor: {
      id: sessionOrRes?.user?.id || sessionOrRes?.user?.id_user,
      role: normRole(sessionOrRes?.user?.role),
      source: "session",
    },
  };
}

export function guardRole(actor, allowedRoles) {
  if (!allowedRoles.has(normRole(actor?.role))) {
    return NextResponse.json(
      { message: "Forbidden: Anda tidak memiliki akses ke resource ini." },
      { status: 403 },
    );
  }

  return null;
}

export function buildSelect() {
  return {
    id_item_komponen_payroll: true,
    id_payroll_karyawan: true,
    id_definisi_komponen_payroll: true,
    id_user_pembuat: true,
    kunci_idempoten: true,
    tipe_komponen: true,
    arah_komponen: true,
    nama_komponen: true,
    nominal: true,
    kena_pajak: true,
    urutan_tampil: true,
    catatan: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    payroll_karyawan: {
      select: {
        id_payroll_karyawan: true,
        id_periode_payroll: true,
        id_user: true,
        nama_karyawan: true,
        jenis_hubungan_kerja: true,
        id_tarif_pajak_ter: true,
        kode_kategori_pajak_snapshot: true,
        persen_tarif_snapshot: true,
        penghasilan_dari_snapshot: true,
        penghasilan_sampai_snapshot: true,
        berlaku_mulai_tarif_snapshot: true,
        berlaku_sampai_tarif_snapshot: true,
        total_pendapatan_bruto: true,
        total_potongan: true,
        pph21_nominal: true,
        pendapatan_bersih: true,
        bank_name: true,
        bank_account: true,
        status_payroll: true,
        dibayar_pada: true,
        finalized_at: true,
        locked_at: true,
        catatan: true,
        deleted_at: true,
        periode: {
          select: {
            id_periode_payroll: true,
            tahun: true,
            bulan: true,
            tanggal_mulai: true,
            tanggal_selesai: true,
            status_periode: true,
            diproses_pada: true,
            difinalkan_pada: true,
            deleted_at: true,
          },
        },
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
        user: {
          select: {
            id_user: true,
            nama_pengguna: true,
            email: true,
            nomor_induk_karyawan: true,
            status_kerja: true,
            nomor_rekening: true,
            jenis_bank: true,
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
    definisi_komponen: {
      select: {
        id_definisi_komponen_payroll: true,
        id_tipe_komponen_payroll: true,
        nama_komponen: true,
        arah_komponen: true,
        kena_pajak_default: true,
        berulang_default: true,
        aktif: true,
        deleted_at: true,
        tipe_komponen: {
          select: {
            id_tipe_komponen_payroll: true,
            nama_tipe_komponen: true,
            deleted_at: true,
          },
        },
      },
    },
    pembuat: {
      select: {
        id_user: true,
        nama_pengguna: true,
        email: true,
        role: true,
        deleted_at: true,
      },
    },
  };
}

export function enrichItem(data) {
  if (!data) return data;

  const payrollStatus = String(
    data?.payroll_karyawan?.status_payroll || "",
  ).toUpperCase();
  const periodeStatus = String(
    data?.payroll_karyawan?.periode?.status_periode || "",
  ).toUpperCase();

  const payrollImmutable =
    IMMUTABLE_PAYROLL_STATUS.has(payrollStatus) ||
    Boolean(data?.payroll_karyawan?.locked_at) ||
    Boolean(data?.payroll_karyawan?.finalized_at);

  const periodeImmutable =
    IMMUTABLE_PERIODE_STATUS.has(periodeStatus) ||
    Boolean(data?.payroll_karyawan?.periode?.difinalkan_pada);

  const isDeleted =
    Boolean(data?.deleted_at) ||
    Boolean(data?.payroll_karyawan?.deleted_at) ||
    Boolean(data?.payroll_karyawan?.periode?.deleted_at);

  return {
    ...data,
    business_state: {
      payroll_immutable: payrollImmutable,
      periode_immutable: periodeImmutable,
      sourced_from_definition: Boolean(data?.id_definisi_komponen_payroll),
      system_generated: !String(data?.kunci_idempoten || "").startsWith(
        "manual:",
      ),
      bisa_diubah: !isDeleted && !payrollImmutable && !periodeImmutable,
      bisa_dihapus: !isDeleted && !payrollImmutable && !periodeImmutable,
    },
  };
}

export async function ensurePayrollEditable(
  tx,
  id_payroll_karyawan,
  fieldName = "id_payroll_karyawan",
) {
  const payroll = await tx.payrollKaryawan.findUnique({
    where: {
      id_payroll_karyawan,
    },
    select: {
      id_payroll_karyawan: true,
      id_user: true,
      status_payroll: true,
      finalized_at: true,
      locked_at: true,
      deleted_at: true,
      periode: {
        select: {
          id_periode_payroll: true,
          status_periode: true,
          difinalkan_pada: true,
          deleted_at: true,
        },
      },
    },
  });

  if (!payroll) {
    throw new Error(
      `Payroll karyawan pada field '${fieldName}' tidak ditemukan.`,
    );
  }

  if (payroll.deleted_at) {
    throw new Error("Payroll karyawan yang dipilih sudah dihapus.");
  }

  if (!payroll.periode) {
    throw new Error("Periode payroll untuk data induk tidak ditemukan.");
  }

  if (payroll.periode.deleted_at) {
    throw new Error("Periode payroll untuk data induk sudah dihapus.");
  }

  const statusPayroll = String(payroll.status_payroll || "").toUpperCase();
  const statusPeriode = String(
    payroll.periode.status_periode || "",
  ).toUpperCase();

  if (!STATUS_PAYROLL_VALUES.has(statusPayroll)) {
    throw new Error("Status payroll pada data induk tidak valid.");
  }

  if (!STATUS_PERIODE_VALUES.has(statusPeriode)) {
    throw new Error("Status periode payroll pada data induk tidak valid.");
  }

  if (
    IMMUTABLE_PAYROLL_STATUS.has(statusPayroll) ||
    payroll.locked_at ||
    payroll.finalized_at
  ) {
    throw new Error(
      "Payroll karyawan yang dipilih sudah final/terkunci dan itemnya tidak boleh diubah.",
    );
  }

  if (
    IMMUTABLE_PERIODE_STATUS.has(statusPeriode) ||
    payroll.periode.difinalkan_pada
  ) {
    throw new Error("Periode payroll untuk data induk sudah final/terkunci.");
  }

  return payroll;
}

export async function getDefinitionForItem(
  tx,
  id_definisi_komponen_payroll,
  options = {},
) {
  const { allowInactive = false } = options;

  const definisi = await tx.definisiKomponenPayroll.findUnique({
    where: {
      id_definisi_komponen_payroll,
    },
    select: {
      id_definisi_komponen_payroll: true,
      id_tipe_komponen_payroll: true,
      nama_komponen: true,
      arah_komponen: true,
      kena_pajak_default: true,
      aktif: true,
      deleted_at: true,
      tipe_komponen: {
        select: {
          id_tipe_komponen_payroll: true,
          nama_tipe_komponen: true,
          deleted_at: true,
        },
      },
    },
  });

  if (!definisi) {
    throw new Error("Definisi komponen payroll tidak ditemukan.");
  }

  if (definisi.deleted_at) {
    throw new Error("Definisi komponen payroll yang dipilih sudah dihapus.");
  }

  if (definisi.tipe_komponen?.deleted_at) {
    throw new Error(
      "Tipe komponen payroll untuk definisi yang dipilih sudah dihapus.",
    );
  }

  if (!allowInactive && !definisi.aktif) {
    throw new Error("Definisi komponen payroll yang dipilih tidak aktif.");
  }

  return definisi;
}

export async function getValidTipeKomponen(tx, namaTipeKomponen) {
  const normalized = String(namaTipeKomponen || "")
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error("Field 'tipe_komponen' wajib diisi.");
  }

  const rows = await tx.tipeKomponenPayroll.findMany({
    where: {
      deleted_at: null,
    },
    select: {
      id_tipe_komponen_payroll: true,
      nama_tipe_komponen: true,
    },
    orderBy: [{ nama_tipe_komponen: "asc" }],
  });

  const found =
    rows.find(
      (item) =>
        String(item?.nama_tipe_komponen || "")
          .trim()
          .toUpperCase() === normalized,
    ) || null;

  if (!found) {
    throw new Error(
      `tipe_komponen '${normalized}' tidak ditemukan pada master TipeKomponenPayroll aktif.`,
    );
  }

  return found;
}

export async function recalculatePayrollTotals(tx, id_payroll_karyawan) {
  const [payroll, items] = await Promise.all([
    tx.payrollKaryawan.findUnique({
      where: {
        id_payroll_karyawan,
      },
      select: {
        id_payroll_karyawan: true,
      },
    }),
    tx.itemKomponenPayroll.findMany({
      where: {
        id_payroll_karyawan,
        deleted_at: null,
      },
      select: {
        tipe_komponen: true,
        arah_komponen: true,
        nominal: true,
      },
    }),
  ]);

  if (!payroll) {
    throw new Error("Payroll karyawan tidak ditemukan.");
  }

  let totalPendapatanBruto = 0n;
  let totalPotongan = 0n;
  let pph21Nominal = 0n;

  for (const item of items) {
    const nominal = decimalToScaledBigInt(String(item.nominal), DECIMAL_SCALE);

    if (item.arah_komponen === "PEMASUKAN") {
      totalPendapatanBruto += nominal;
      continue;
    }

    if (item.arah_komponen === "POTONGAN") {
      totalPotongan += nominal;

      if (String(item.tipe_komponen || "").toUpperCase() === "PAJAK") {
        pph21Nominal += nominal;
      }
    }
  }

  const pendapatanBersih = totalPendapatanBruto - totalPotongan;

  if (pendapatanBersih < 0n) {
    throw new Error(
      "Perubahan item komponen payroll membuat pendapatan_bersih bernilai negatif.",
    );
  }

  const payload = {
    total_pendapatan_bruto: scaledBigIntToDecimalString(
      totalPendapatanBruto,
      DECIMAL_SCALE,
    ),
    total_potongan: scaledBigIntToDecimalString(totalPotongan, DECIMAL_SCALE),
    pph21_nominal: scaledBigIntToDecimalString(pph21Nominal, DECIMAL_SCALE),
    pendapatan_bersih: scaledBigIntToDecimalString(
      pendapatanBersih,
      DECIMAL_SCALE,
    ),
  };

  await tx.payrollKaryawan.update({
    where: {
      id_payroll_karyawan,
    },
    data: payload,
  });

  return payload;
}

export async function findDuplicateIdempotencyKey(
  tx,
  { kunci_idempoten, excludeId = null } = {},
) {
  if (!kunci_idempoten) return null;

  return tx.itemKomponenPayroll.findFirst({
    where: {
      kunci_idempoten,
      ...(excludeId
        ? {
            NOT: {
              id_item_komponen_payroll: excludeId,
            },
          }
        : {}),
    },
    select: {
      id_item_komponen_payroll: true,
      deleted_at: true,
    },
  });
}

function buildManualIdempotencyKey({ id_payroll_karyawan, actorId = null }) {
  return [
    "manual",
    id_payroll_karyawan || "payroll",
    actorId || "system",
    randomUUID(),
  ].join(":");
}

export async function resolveItemPayload(
  tx,
  input,
  existing = null,
  actor = null,
) {
  const id_payroll_karyawan = hasOwn(input, "id_payroll_karyawan")
    ? input.id_payroll_karyawan
    : existing?.id_payroll_karyawan;

  if (!id_payroll_karyawan) {
    throw new Error("Field 'id_payroll_karyawan' wajib diisi.");
  }

  await ensurePayrollEditable(tx, id_payroll_karyawan);

  if (
    existing?.id_payroll_karyawan &&
    existing.id_payroll_karyawan !== id_payroll_karyawan
  ) {
    await ensurePayrollEditable(
      tx,
      existing.id_payroll_karyawan,
      "existing.id_payroll_karyawan",
    );
  }

  const id_definisi_komponen_payroll = hasOwn(
    input,
    "id_definisi_komponen_payroll",
  )
    ? input.id_definisi_komponen_payroll
    : (existing?.id_definisi_komponen_payroll ?? null);

  const definitionExplicitlyChanged = hasOwn(
    input,
    "id_definisi_komponen_payroll",
  );
  const isUnchangedExistingDefinition =
    Boolean(existing?.id_definisi_komponen_payroll) &&
    !definitionExplicitlyChanged &&
    existing.id_definisi_komponen_payroll === id_definisi_komponen_payroll;

  const definisi = id_definisi_komponen_payroll
    ? await getDefinitionForItem(tx, id_definisi_komponen_payroll, {
        allowInactive: isUnchangedExistingDefinition,
      })
    : null;

  const id_user_pembuat = hasOwn(input, "id_user_pembuat")
    ? input.id_user_pembuat
    : (existing?.id_user_pembuat ?? actor?.id ?? null);

  let kunci_idempoten = hasOwn(input, "kunci_idempoten")
    ? input.kunci_idempoten
    : existing?.kunci_idempoten;

  if (!kunci_idempoten) {
    kunci_idempoten = buildManualIdempotencyKey({
      id_payroll_karyawan,
      actorId: id_user_pembuat || actor?.id || null,
    });
  }

  let tipe_komponen = null;
  let arah_komponen = null;
  let nama_komponen = null;
  let kena_pajak = false;

  if (definisi) {
    const tipeDefinisi = String(
      definisi?.tipe_komponen?.nama_tipe_komponen || "",
    ).trim();

    if (!tipeDefinisi) {
      throw new Error(
        "Definisi komponen payroll belum terhubung dengan tipe komponen payroll yang valid.",
      );
    }

    tipe_komponen = tipeDefinisi;
    arah_komponen = String(definisi.arah_komponen || "")
      .trim()
      .toUpperCase();
    nama_komponen = String(definisi.nama_komponen || "").trim();
    kena_pajak = Boolean(definisi.kena_pajak_default);
  } else {
    const requestedTipeKomponen = hasOwn(input, "tipe_komponen")
      ? input.tipe_komponen
      : existing?.tipe_komponen;
    const validTipeKomponen = await getValidTipeKomponen(
      tx,
      requestedTipeKomponen,
    );

    tipe_komponen = String(validTipeKomponen.nama_tipe_komponen || "").trim();
    arah_komponen = hasOwn(input, "arah_komponen")
      ? input.arah_komponen
      : existing?.arah_komponen;
    nama_komponen = hasOwn(input, "nama_komponen")
      ? input.nama_komponen
      : existing?.nama_komponen;
    kena_pajak = hasOwn(input, "kena_pajak")
      ? input.kena_pajak
      : Boolean(existing?.kena_pajak);
  }

  const nominal = hasOwn(input, "nominal")
    ? input.nominal
    : existing?.nominal !== undefined && existing?.nominal !== null
      ? String(existing.nominal)
      : undefined;

  const urutan_tampil = hasOwn(input, "urutan_tampil")
    ? input.urutan_tampil
    : (existing?.urutan_tampil ?? 0);

  if (!tipe_komponen) {
    throw new Error("Field 'tipe_komponen' wajib diisi.");
  }

  if (!arah_komponen) {
    throw new Error("Field 'arah_komponen' wajib diisi.");
  }

  if (!nama_komponen) {
    throw new Error("Field 'nama_komponen' wajib diisi.");
  }

  if (!nominal) {
    throw new Error("Field 'nominal' wajib diisi.");
  }

  if (!ARAH_KOMPONEN_VALUES.has(String(arah_komponen).toUpperCase())) {
    throw new Error(
      `arah_komponen tidak valid. Nilai yang diizinkan: ${Array.from(ARAH_KOMPONEN_VALUES).join(", ")}`,
    );
  }

  if (decimalToScaledBigInt(nominal, DECIMAL_SCALE) <= 0n) {
    throw new Error("Field 'nominal' harus lebih besar dari 0.");
  }

  if (
    String(tipe_komponen).trim().toUpperCase() === "PAJAK" &&
    String(arah_komponen).trim().toUpperCase() !== "POTONGAN"
  ) {
    throw new Error(
      "Tipe komponen 'PAJAK' wajib memiliki 'arah_komponen' bernilai 'POTONGAN'.",
    );
  }

  return {
    payload: {
      id_payroll_karyawan,
      id_definisi_komponen_payroll,
      id_user_pembuat,
      kunci_idempoten,
      tipe_komponen,
      arah_komponen: String(arah_komponen).trim().toUpperCase(),
      nama_komponen,
      nominal,
      kena_pajak,
      urutan_tampil: urutan_tampil ?? 0,
    },
  };
}

export async function getExistingItem(id) {
  return db.itemKomponenPayroll.findUnique({
    where: {
      id_item_komponen_payroll: id,
    },
    select: {
      id_item_komponen_payroll: true,
      id_payroll_karyawan: true,
      id_definisi_komponen_payroll: true,
      id_user_pembuat: true,
      kunci_idempoten: true,
      tipe_komponen: true,
      arah_komponen: true,
      nama_komponen: true,
      nominal: true,
      kena_pajak: true,
      urutan_tampil: true,
      catatan: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });
}

export function buildItemValidationMessage(err) {
  const message = String(err?.message || "");

  if (!message) return "";

  const knownPatterns = [
    "Field '",
    "tidak valid",
    "tidak ditemukan",
    "sudah dihapus",
    "sudah final",
    "terkunci",
    "pendapatan_bersih",
    "kunci idempoten",
    "Tipe komponen",
    "tipe_komponen",
    "arah_komponen",
    "Payroll karyawan",
    "Periode payroll",
    "Definisi komponen payroll",
  ];

  return knownPatterns.some((pattern) => message.includes(pattern))
    ? message
    : "";
}

export function buildErrorResponse(
  err,
  { logLabel, notFoundMessage = "Item komponen payroll tidak ditemukan." } = {},
) {
  if (err?.code === "P2025") {
    return NextResponse.json({ message: notFoundMessage }, { status: 404 });
  }

  if (err?.code === "P2002") {
    return NextResponse.json(
      { message: "Kunci idempoten sudah digunakan." },
      { status: 409 },
    );
  }

  if (err?.code === "P2003") {
    return NextResponse.json(
      {
        message: "Relasi data tidak valid atau data referensi tidak ditemukan.",
      },
      { status: 400 },
    );
  }

  if (err?.statusCode) {
    return NextResponse.json(
      { message: err.message },
      { status: err.statusCode },
    );
  }

  const validationMessage = buildItemValidationMessage(err);

  if (validationMessage) {
    return NextResponse.json({ message: validationMessage }, { status: 400 });
  }

  if (logLabel) {
    console.error(logLabel, err);
  }

  return NextResponse.json({ message: "Server error" }, { status: 500 });
}
