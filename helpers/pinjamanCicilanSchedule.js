const DECIMAL_SCALE = 2;

function stripLeadingZeros(numStr) {
  const stripped = String(numStr || '0').replace(/^0+(?=\d)/, '');
  return stripped || '0';
}

function decimalToScaledBigInt(value, scale = DECIMAL_SCALE) {
  const stringValue = String(value);
  const negative = stringValue.startsWith('-');
  const unsigned = negative ? stringValue.slice(1) : stringValue;
  const [intPartRaw, fracPartRaw = ''] = unsigned.split('.');
  const intPart = stripLeadingZeros(intPartRaw || '0');
  const fracPart = fracPartRaw.padEnd(scale, '0').slice(0, scale);
  const bigintValue = BigInt(`${intPart}${fracPart}`);

  return negative ? -bigintValue : bigintValue;
}

function scaledBigIntToDecimalString(value, scale = DECIMAL_SCALE) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const padded = absolute.toString().padStart(scale + 1, '0');
  const integerPart = padded.slice(0, -scale) || '0';
  const fractionPart = padded.slice(-scale);

  return `${negative ? '-' : ''}${integerPart}.${fractionPart}`;
}

function toDateOnlyComparable(value) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())).getTime();
}

function addMonthsPreservingDay(baseDate, monthOffset) {
  const targetMonthStart = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + monthOffset, 1));
  const lastDayOfTargetMonth = new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth() + 1, 0)).getUTCDate();

  return new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth(), Math.min(baseDate.getUTCDate(), lastDayOfTargetMonth)));
}

function buildGeneratedCicilanSchedule({ nominal_pinjaman, nominal_cicilan, tanggal_mulai }) {
  if (!(tanggal_mulai instanceof Date) || Number.isNaN(tanggal_mulai.getTime())) {
    throw new Error("Field 'tanggal_mulai' harus berupa tanggal yang valid.");
  }

  const totalPinjaman = decimalToScaledBigInt(nominal_pinjaman, DECIMAL_SCALE);
  const nominalPerCicilan = decimalToScaledBigInt(nominal_cicilan, DECIMAL_SCALE);

  if (totalPinjaman <= 0n) {
    throw new Error("Field 'nominal_pinjaman' harus lebih besar dari 0.");
  }

  if (nominalPerCicilan <= 0n) {
    throw new Error("Field 'nominal_cicilan' harus lebih besar dari 0.");
  }

  const cicilanDrafts = [];
  let remaining = totalPinjaman;
  let monthOffset = 0;

  while (remaining > 0n) {
    const nominalTagihan = remaining > nominalPerCicilan ? nominalPerCicilan : remaining;

    cicilanDrafts.push({
      jatuh_tempo: addMonthsPreservingDay(tanggal_mulai, monthOffset),
      nominal_tagihan: scaledBigIntToDecimalString(nominalTagihan, DECIMAL_SCALE),
      nominal_terbayar: scaledBigIntToDecimalString(0n, DECIMAL_SCALE),
      status_cicilan: 'MENUNGGU',
      diposting_pada: null,
      dibayar_pada: null,
      id_payroll_karyawan: null,
      catatan: null,
    });

    remaining -= nominalTagihan;
    monthOffset += 1;
  }

  return {
    cicilanDrafts,
    tanggal_selesai: cicilanDrafts[cicilanDrafts.length - 1]?.jatuh_tempo || tanggal_mulai,
  };
}

module.exports = {
  DECIMAL_SCALE,
  buildGeneratedCicilanSchedule,
  decimalToScaledBigInt,
  scaledBigIntToDecimalString,
  toDateOnlyComparable,
};
