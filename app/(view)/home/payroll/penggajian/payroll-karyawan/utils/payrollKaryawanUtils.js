'use client';

export const STATUS_PAYROLL_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'TERSIMPAN', label: 'Tersimpan' },
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'DIBAYAR', label: 'Dibayar' },
];

export const JENIS_HUBUNGAN_OPTIONS = [
  { value: 'PKWTT', label: 'PKWTT' },
  { value: 'PKWT', label: 'PKWT' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

export function createInitialPayrollKaryawanForm(defaultPeriode = '') {
  return {
    id_periode_payroll: defaultPeriode,
    id_user: '',
    nama_karyawan_snapshot: '',
    jenis_hubungan_snapshot: 'PKWTT',
    id_tarif_pajak_ter: '',
    kode_kategori_pajak_snapshot: '',
    persen_tarif_snapshot: 0,
    penghasilan_dari_snapshot: 0,
    penghasilan_sampai_snapshot: null,
    berlaku_mulai_tarif_snapshot: '',
    berlaku_sampai_tarif_snapshot: null,
    nama_departement_snapshot: '',
    nama_jabatan_snapshot: '',
    nama_bank_snapshot: '',
    nomor_rekening_snapshot: '',
    total_pendapatan_tetap: 0,
    total_pendapatan_variabel: 0,
    total_bruto_kena_pajak: 0,
    persen_pajak: 0,
    total_pajak: 0,
    total_potongan_lain: 0,
    total_dibayarkan: 0,
    status_payroll: 'DRAFT',
    dibayar_pada: null,
    catatan: '',
  };
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatBulan(value) {
  const bulanMap = {
    JANUARI: 'Januari',
    FEBRUARI: 'Februari',
    MARET: 'Maret',
    APRIL: 'April',
    MEI: 'Mei',
    JUNI: 'Juni',
    JULI: 'Juli',
    AGUSTUS: 'Agustus',
    SEPTEMBER: 'September',
    OKTOBER: 'Oktober',
    NOVEMBER: 'November',
    DESEMBER: 'Desember',
    1: 'Januari',
    2: 'Februari',
    3: 'Maret',
    4: 'April',
    5: 'Mei',
    6: 'Juni',
    7: 'Juli',
    8: 'Agustus',
    9: 'September',
    10: 'Oktober',
    11: 'November',
    12: 'Desember',
  };

  const key = typeof value === 'number' ? String(value) : String(value || '').trim().toUpperCase();
  return bulanMap[key] || '-';
}

export function formatJenisHubungan(value) {
  const map = {
    PKWTT: 'PKWTT',
    PKWT: 'PKWT',
    FREELANCE: 'Freelance',
    INTERNSHIP: 'Internship',
  };

  return map[String(value || '').trim().toUpperCase()] || value || '-';
}

export function formatTarifPajakSnapshot(kodeKategoriPajak, persenTarif) {
  const kode = String(kodeKategoriPajak || '').trim();
  const persen = toNumber(persenTarif);

  if (!kode) return '-';
  if (!Number.isFinite(persen) || persen <= 0) return kode;

  return `${kode} (${persen}%)`;
}

export function formatStatusPayroll(status) {
  const map = {
    DRAFT: {
      label: 'Draft',
      tone: 'neutral',
    },
    TERSIMPAN: {
      label: 'Tersimpan',
      tone: 'info',
    },
    DISETUJUI: {
      label: 'Disetujui',
      tone: 'info',
    },
    DIBAYAR: {
      label: 'Dibayar',
      tone: 'success',
    },
  };

  return (
    map[String(status || '').trim().toUpperCase()] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}

export function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

export function normalizePayrollKaryawanItem(item) {
  if (!item) return null;

  const totalPendapatanBruto = toNumber(item.total_pendapatan_bruto);
  const totalPotongan = toNumber(item.total_potongan);
  const pph21Nominal = toNumber(item.pph21_nominal);
  const totalPotonganLain = Math.max(totalPotongan - pph21Nominal, 0);
  const periodeLabel = item?.periode ? formatPeriodeLabel(item.periode) : '-';

  return {
    ...item,
    nama_karyawan_snapshot: item.nama_karyawan || item?.user?.nama_pengguna || '-',
    jenis_hubungan_snapshot: item.jenis_hubungan_kerja || '',
    nama_departement_snapshot: item?.user?.departement?.nama_departement || '',
    nama_jabatan_snapshot: item?.user?.jabatan?.nama_jabatan || '',
    nama_bank_snapshot: item.bank_name || item?.user?.jenis_bank || '',
    nomor_rekening_snapshot: item.bank_account || item?.user?.nomor_rekening || '',
    total_pendapatan_tetap: totalPendapatanBruto,
    total_pendapatan_variabel: 0,
    total_bruto_kena_pajak: totalPendapatanBruto,
    persen_pajak: toNumber(item.persen_tarif_snapshot),
    total_pajak: pph21Nominal,
    total_potongan_lain: totalPotonganLain,
    total_dibayarkan: toNumber(item.pendapatan_bersih),
    periode_label: periodeLabel,
    periode_status: item?.periode?.status_periode || '',
    item_komponen_count: Number(item?._count?.item_komponen || 0),
  };
}

export function buildPayrollKaryawanPayload(formData) {
  const totalPendapatanTetap = toNumber(formData.total_pendapatan_tetap);
  const totalPendapatanVariabel = toNumber(formData.total_pendapatan_variabel);
  const totalPendapatanBruto = toNumber(formData.total_bruto_kena_pajak) || totalPendapatanTetap + totalPendapatanVariabel;
  const totalPajak = toNumber(formData.total_pajak);
  const totalPotonganLain = toNumber(formData.total_potongan_lain);
  const totalPotongan = totalPajak + totalPotonganLain;
  const pendapatanBersih = toNumber(formData.total_dibayarkan) || Math.max(totalPendapatanBruto - totalPotongan, 0);

  return {
    id_periode_payroll: String(formData.id_periode_payroll || '').trim(),
    id_user: String(formData.id_user || '').trim(),
    id_tarif_pajak_ter: String(formData.id_tarif_pajak_ter || '').trim() || null,
    nama_karyawan: String(formData.nama_karyawan_snapshot || '').trim(),
    jenis_hubungan_kerja: String(formData.jenis_hubungan_snapshot || 'PKWTT')
      .trim()
      .toUpperCase(),
    bank_name: String(formData.nama_bank_snapshot || '').trim() || null,
    bank_account: String(formData.nomor_rekening_snapshot || '').trim() || null,
    total_pendapatan_bruto: totalPendapatanBruto,
    total_potongan: totalPotongan,
    pph21_nominal: totalPajak,
    pendapatan_bersih: pendapatanBersih,
    status_payroll: String(formData.status_payroll || 'DRAFT')
      .trim()
      .toUpperCase(),
    dibayar_pada:
      String(formData.status_payroll || '').trim().toUpperCase() === 'DIBAYAR' ? formData.dibayar_pada || new Date().toISOString() : null,
    catatan: String(formData.catatan || '').trim() || null,
  };
}
