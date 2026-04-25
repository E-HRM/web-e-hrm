import { recalculatePayrollTotals } from "@/app/api/admin/payroll-karyawan/payrollRecalculation.shared";

const MONEY_SCALE = 2;

export const IMMUTABLE_PAYROLL_STATUS = new Set(["DISETUJUI", "DIBAYAR"]);
export const IMMUTABLE_PERIODE_STATUS = new Set(["FINAL", "TERKUNCI"]);

function stripLeadingZeros(numStr) {
  const stripped = String(numStr || "0").replace(/^0+(?=\d)/, "");
  return stripped || "0";
}

export function decimalToScaledBigInt(value, scale = MONEY_SCALE) {
  const stringValue = String(value);
  const negative = stringValue.startsWith("-");
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ""] = unsigned.split(".");
  const intPart = stripLeadingZeros(intPartRaw || "0");
  const fracPart = fracPartRaw.padEnd(scale, "0").slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);

  return negative ? -bigintValue : bigintValue;
}

export function scaledBigIntToDecimalString(value, scale = MONEY_SCALE) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, "0");
  const integerPart = padded.slice(0, -scale) || "0";
  const fractionPart = padded.slice(-scale);

  return `${negative ? "-" : ""}${integerPart}.${fractionPart}`;
}

function formatDateLabel(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

function buildCicilanPayrollItemKey(id_cicilan_pinjaman_karyawan) {
  return `cicilan-pinjaman:${id_cicilan_pinjaman_karyawan}`;
}

function buildCicilanPayrollItemName(cicilan) {
  const loanName = String(
    cicilan?.pinjaman_karyawan?.nama_pinjaman || "",
  ).trim();

  if (loanName) {
    return loanName;
  }

  return "Pinjaman";
}

function buildCicilanPayrollItemNote(cicilan) {
  const userName = String(
    cicilan?.pinjaman_karyawan?.user?.nama_pengguna || "karyawan",
  ).trim();
  const identity = String(
    cicilan?.pinjaman_karyawan?.user?.nomor_induk_karyawan || "",
  ).trim();
  const loanName = String(
    cicilan?.pinjaman_karyawan?.nama_pinjaman || "pinjaman",
  ).trim();
  const dueDate = formatDateLabel(cicilan?.jatuh_tempo);

  const identityLabel = identity ? ` (${identity})` : "";
  const dueDateLabel = dueDate ? ` jatuh tempo ${dueDate}` : "";

  return `Posting cicilan ${loanName} untuk ${userName}${identityLabel}.${dueDateLabel}`.trim();
}

export async function ensurePayrollPostingTarget(
  tx,
  { id_payroll_karyawan, id_user = null },
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
      deleted_at: true,
      periode: {
        select: {
          id_periode_payroll: true,
          status_periode: true,
        },
      },
    },
  });

  if (!payroll) {
    throw new Error("Payroll karyawan tujuan tidak ditemukan.");
  }

  if (payroll.deleted_at) {
    throw new Error(
      "Payroll tujuan untuk posting cicilan pinjaman sudah dihapus.",
    );
  }

  if (id_user && payroll.id_user !== id_user) {
    throw new Error(
      "Payroll tujuan harus dimiliki oleh user yang sama dengan pinjaman.",
    );
  }

  if (
    IMMUTABLE_PAYROLL_STATUS.has(
      String(payroll.status_payroll || "").toUpperCase(),
    ) ||
    payroll.finalized_at
  ) {
    throw new Error(
      "Payroll tujuan sudah tidak bisa diubah karena status payroll tidak mutable.",
    );
  }

  if (
    IMMUTABLE_PERIODE_STATUS.has(
      String(payroll.periode?.status_periode || "").toUpperCase(),
    )
  ) {
    throw new Error("Periode payroll tujuan sudah final atau terkunci.");
  }

  return payroll;
}

async function getDefinitionForCicilanPosting(tx) {
  return tx.definisiKomponenPayroll.findFirst({
    where: {
      aktif: true,
      deleted_at: null,
      tipe_komponen: {
        is: {
          nama_tipe_komponen: "CICILAN_PINJAMAN",
          deleted_at: null,
        },
      },
      arah_komponen: "POTONGAN",
    },
    orderBy: [{ created_at: "asc" }],
    select: {
      id_definisi_komponen_payroll: true,
      nama_komponen: true,
    },
  });
}

export async function recalculateLoanSnapshot(tx, id_pinjaman_karyawan) {
  const [loan, paidSummary] = await Promise.all([
    tx.pinjamanKaryawan.findUnique({
      where: { id_pinjaman_karyawan },
      select: {
        id_pinjaman_karyawan: true,
        nominal_pinjaman: true,
        status_pinjaman: true,
      },
    }),
    tx.cicilanPinjamanKaryawan.aggregate({
      where: {
        id_pinjaman_karyawan,
        deleted_at: null,
      },
      _sum: {
        nominal_terbayar: true,
      },
    }),
  ]);

  if (!loan) {
    throw new Error("Pinjaman karyawan tidak ditemukan.");
  }

  const totalPaid = paidSummary._sum.nominal_terbayar
    ? String(paidSummary._sum.nominal_terbayar)
    : "0.00";
  const newSaldo =
    decimalToScaledBigInt(String(loan.nominal_pinjaman), MONEY_SCALE) -
    decimalToScaledBigInt(totalPaid, MONEY_SCALE);

  if (newSaldo < 0n) {
    throw new Error(
      "Akumulasi 'nominal_terbayar' cicilan melebihi 'nominal_pinjaman'.",
    );
  }

  const sisa_saldo = scaledBigIntToDecimalString(newSaldo, MONEY_SCALE);
  const status_pinjaman =
    loan.status_pinjaman === "DRAFT"
      ? "DRAFT"
      : loan.status_pinjaman === "DIBATALKAN"
        ? "DIBATALKAN"
        : newSaldo === 0n
          ? "LUNAS"
          : "AKTIF";

  await tx.pinjamanKaryawan.update({
    where: { id_pinjaman_karyawan },
    data: {
      sisa_saldo,
      status_pinjaman,
    },
  });

  return {
    sisa_saldo,
    status_pinjaman,
    total_terbayar: totalPaid,
  };
}

function normalizePostingItemOptions(options = {}) {
  const rawUrutan = Number(options?.urutan_tampil);
  const rawCatatan = typeof options?.catatan_item_payroll === "string"
    ? options.catatan_item_payroll.trim()
    : "";

  return {
    urutan_tampil: Number.isFinite(rawUrutan)
      ? Math.max(Math.trunc(rawUrutan), 0)
      : undefined,
    catatan_item_payroll: rawCatatan || null,
  };
}

export async function syncCicilanPayrollPosting(
  tx,
  cicilan,
  actor = null,
  options = {},
) {
  const existingItem = await tx.itemKomponenPayroll.findFirst({
    where: {
      kunci_idempoten: buildCicilanPayrollItemKey(
        cicilan.id_cicilan_pinjaman_karyawan,
      ),
    },
    select: {
      id_item_komponen_payroll: true,
      id_payroll_karyawan: true,
      id_definisi_komponen_payroll: true,
      tipe_komponen: true,
      arah_komponen: true,
      nama_komponen: true,
      nominal: true,
      urutan_tampil: true,
      catatan: true,
      deleted_at: true,
    },
  });

  const postingOptions = normalizePostingItemOptions(options);

  const shouldPost =
    !cicilan.deleted_at &&
    Boolean(cicilan.id_payroll_karyawan) &&
    ["DIPOSTING", "DIBAYAR"].includes(
      String(cicilan.status_cicilan || "").toUpperCase(),
    );

  const touchedPayrollIds = new Set();
  let itemSummary = null;

  if (shouldPost) {
    const payrollTarget = await ensurePayrollPostingTarget(tx, {
      id_payroll_karyawan: cicilan.id_payroll_karyawan,
      id_user:
        cicilan?.pinjaman_karyawan?.id_user ||
        cicilan?.payroll_karyawan?.id_user ||
        null,
    });

    const payload = {
      id_payroll_karyawan: payrollTarget.id_payroll_karyawan,
      id_definisi_komponen_payroll: null,
      id_user_pembuat: actor?.id ?? null,
      kunci_idempoten: buildCicilanPayrollItemKey(
        cicilan.id_cicilan_pinjaman_karyawan,
      ),
      tipe_komponen: "PINJAMAN",
      arah_komponen: "POTONGAN",
      nama_komponen: buildCicilanPayrollItemName(cicilan),
      nominal: String(cicilan.nominal_tagihan),
      urutan_tampil:
        postingOptions.urutan_tampil ??
        existingItem?.urutan_tampil ??
        920,
      catatan:
        postingOptions.catatan_item_payroll ??
        existingItem?.catatan ??
        buildCicilanPayrollItemNote(cicilan),
      deleted_at: null,
    };

    let item;

    if (existingItem) {
      if (existingItem.id_payroll_karyawan) {
        touchedPayrollIds.add(existingItem.id_payroll_karyawan);
      }

      item = await tx.itemKomponenPayroll.update({
        where: {
          id_item_komponen_payroll: existingItem.id_item_komponen_payroll,
        },
        data: payload,
        select: {
          id_item_komponen_payroll: true,
          id_payroll_karyawan: true,
        },
      });
    } else {
      item = await tx.itemKomponenPayroll.create({
        data: payload,
        select: {
          id_item_komponen_payroll: true,
          id_payroll_karyawan: true,
        },
      });
    }

    touchedPayrollIds.add(payrollTarget.id_payroll_karyawan);
    itemSummary = {
      action: existingItem ? "updated" : "created",
      ...item,
    };
  } else if (existingItem && !existingItem.deleted_at) {
    if (existingItem.id_payroll_karyawan) {
      await ensurePayrollPostingTarget(tx, {
        id_payroll_karyawan: existingItem.id_payroll_karyawan,
      });
      touchedPayrollIds.add(existingItem.id_payroll_karyawan);
    }

    await tx.itemKomponenPayroll.update({
      where: {
        id_item_komponen_payroll: existingItem.id_item_komponen_payroll,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    itemSummary = {
      action: "deleted",
      id_item_komponen_payroll: existingItem.id_item_komponen_payroll,
      id_payroll_karyawan: existingItem.id_payroll_karyawan,
    };
  }

  const payrolls = [];

  for (const payrollId of touchedPayrollIds) {
    if (!payrollId) continue;

    const totals = await recalculatePayrollTotals(tx, payrollId, {
      negativeNetMessage:
        "Perubahan posting cicilan membuat pendapatan_bersih payroll bernilai negatif.",
    });
    payrolls.push({
      id_payroll_karyawan: payrollId,
      totals,
    });
  }

  return {
    item: itemSummary,
    payrolls,
  };
}

export async function markPostedCicilanAsPaidForPayroll(
  tx,
  { id_payroll_karyawan, dibayar_pada = new Date() },
) {
  const rows = await tx.cicilanPinjamanKaryawan.findMany({
    where: {
      id_payroll_karyawan,
      deleted_at: null,
      status_cicilan: "DIPOSTING",
    },
    select: {
      id_cicilan_pinjaman_karyawan: true,
      id_pinjaman_karyawan: true,
      nominal_tagihan: true,
      diposting_pada: true,
    },
  });

  if (!rows.length) {
    return {
      updated_count: 0,
      loan_snapshots: [],
    };
  }

  const loanIds = new Set();

  for (const row of rows) {
    await tx.cicilanPinjamanKaryawan.update({
      where: {
        id_cicilan_pinjaman_karyawan: row.id_cicilan_pinjaman_karyawan,
      },
      data: {
        status_cicilan: "DIBAYAR",
        nominal_terbayar: String(row.nominal_tagihan),
        diposting_pada: row.diposting_pada || dibayar_pada,
        dibayar_pada,
      },
    });

    if (row.id_pinjaman_karyawan) {
      loanIds.add(row.id_pinjaman_karyawan);
    }
  }

  const loan_snapshots = [];

  for (const loanId of loanIds) {
    loan_snapshots.push({
      id_pinjaman_karyawan: loanId,
      ...(await recalculateLoanSnapshot(tx, loanId)),
    });
  }

  return {
    updated_count: rows.length,
    loan_snapshots,
  };
}
