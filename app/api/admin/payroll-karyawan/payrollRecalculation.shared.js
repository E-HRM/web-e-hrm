import { computePph21NominalFromSnapshot } from "./payrollKaryawan.shared";

const DECIMAL_SCALE = 2;
const STATUS_PAYROLL_DRAFT = "DRAFT";

function stripLeadingZeros(numStr) {
  const stripped = String(numStr || "0").replace(/^0+(?=\d)/, "");
  return stripped || "0";
}

function decimalToScaledBigInt(value, scale = DECIMAL_SCALE) {
  const stringValue = String(value);
  const negative = stringValue.startsWith("-");
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ""] = unsigned.split(".");
  const intPart = stripLeadingZeros(intPartRaw || "0");
  const fracPart = fracPartRaw.padEnd(scale, "0").slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);

  return negative ? -bigintValue : bigintValue;
}

function scaledBigIntToDecimalString(value, scale = DECIMAL_SCALE) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, "0");
  const integerPart = padded.slice(0, -scale) || "0";
  const fractionPart = padded.slice(-scale);

  return `${negative ? "-" : ""}${integerPart}.${fractionPart}`;
}

export function buildSystemPph21ItemKey(id_payroll_karyawan) {
  return `system:pph21:${id_payroll_karyawan}`;
}

export function isSystemDerivedPph21Item(item) {
  if (!item?.id_payroll_karyawan) return false;

  return (
    String(item?.kunci_idempoten || "") ===
    buildSystemPph21ItemKey(item.id_payroll_karyawan)
  );
}

export async function recalculatePayrollTotals(tx, id_payroll_karyawan, options = {}) {
  const {
    negativeNetMessage =
      "Perubahan komponen payroll membuat pendapatan_bersih bernilai negatif.",
  } = options;

  const [payroll, items] = await Promise.all([
    tx.payrollKaryawan.findUnique({
      where: { id_payroll_karyawan },
      select: {
        id_payroll_karyawan: true,
        status_payroll: true,
        gaji_pokok_snapshot: true,
        persen_tarif_snapshot: true,
      },
    }),
    tx.itemKomponenPayroll.findMany({
      where: {
        id_payroll_karyawan,
      },
      select: {
        tipe_komponen: true,
        arah_komponen: true,
        nominal: true,
        deleted_at: true,
      },
    }),
  ]);

  if (!payroll) {
    throw new Error("Payroll karyawan tidak ditemukan.");
  }

  const activeItems = items.filter((item) => !item.deleted_at);
  const activeNonTaxItems = activeItems.filter(
    (item) => String(item.tipe_komponen || "").trim().toUpperCase() !== "PAJAK",
  );

  let totalPendapatanBruto = decimalToScaledBigInt(
    String(payroll.gaji_pokok_snapshot || "0"),
    DECIMAL_SCALE,
  );
  let totalPotonganLain = 0n;

  for (const item of activeNonTaxItems) {
    const nominal = decimalToScaledBigInt(String(item.nominal), DECIMAL_SCALE);

    if (item.arah_komponen === "PEMASUKAN") {
      totalPendapatanBruto += nominal;
      continue;
    }

    if (item.arah_komponen === "POTONGAN") {
      totalPotonganLain += nominal;
    }
  }

  const pph21Nominal = decimalToScaledBigInt(
    computePph21NominalFromSnapshot(
      scaledBigIntToDecimalString(totalPendapatanBruto, DECIMAL_SCALE),
      payroll.persen_tarif_snapshot,
      DECIMAL_SCALE,
    ),
    DECIMAL_SCALE,
  );

  const totalPotongan = totalPotonganLain + pph21Nominal;
  const pendapatanBersih = totalPendapatanBruto - totalPotongan;
  const isDraftPayroll =
    String(payroll.status_payroll || "").trim().toUpperCase() ===
    STATUS_PAYROLL_DRAFT;

  if (pendapatanBersih < 0n && !isDraftPayroll) {
    throw new Error(negativeNetMessage);
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
