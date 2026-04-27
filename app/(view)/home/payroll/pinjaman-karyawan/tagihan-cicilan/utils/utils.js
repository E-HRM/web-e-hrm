export const STATUS_CICILAN = {
  MENUNGGU: 'MENUNGGU',
  DIPOSTING: 'DIPOSTING',
  DIBAYAR: 'DIBAYAR',
  DILEWATI: 'DILEWATI',
};

export const STATUS_CICILAN_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: STATUS_CICILAN.MENUNGGU, label: 'Menunggu' },
  { value: STATUS_CICILAN.DIPOSTING, label: 'Diposting ke Payroll' },
  { value: STATUS_CICILAN.DIBAYAR, label: 'Dibayar' },
  { value: STATUS_CICILAN.DILEWATI, label: 'Dilewati' },
];

const BULAN_LABELS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_ENUM_TO_INDEX = {
  JANUARI: 0,
  FEBRUARI: 1,
  MARET: 2,
  APRIL: 3,
  MEI: 4,
  JUNI: 5,
  JULI: 6,
  AGUSTUS: 7,
  SEPTEMBER: 8,
  OKTOBER: 9,
  NOVEMBER: 10,
  DESEMBER: 11,
};

export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeSearchText(value) {
  return normalizeText(value).toLowerCase();
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatEnumLabel(value) {
  const raw = normalizeText(value);
  if (!raw) return '-';

  return raw
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatPeriodeLabel(periode) {
  const rawBulan = periode?.bulan;
  const tahun = Number(periode?.tahun);

  if (!tahun) return '-';

  let bulanIndex = -1;

  if (typeof rawBulan === 'number' && Number.isFinite(rawBulan)) {
    bulanIndex = rawBulan - 1;
  } else {
    const bulanNumber = Number(rawBulan);
    if (Number.isFinite(bulanNumber) && bulanNumber > 0) {
      bulanIndex = bulanNumber - 1;
    } else {
      bulanIndex = BULAN_ENUM_TO_INDEX[normalizeText(rawBulan).toUpperCase()] ?? -1;
    }
  }

  if (bulanIndex < 0 || bulanIndex >= BULAN_LABELS.length) return '-';

  return `${BULAN_LABELS[bulanIndex]} ${tahun}`;
}

export function getStatusCicilanMeta(status) {
  const normalized = normalizeText(status).toUpperCase();

  const map = {
    MENUNGGU: {
      label: 'Menunggu',
      tone: 'warning',
      helper: 'Belum terhubung ke payroll dan belum dibayar.',
    },
    DIPOSTING: {
      label: 'Diposting ke Payroll',
      tone: 'info',
      helper: 'Sudah masuk payroll, menunggu proses pembayaran payroll.',
    },
    DIBAYAR: {
      label: 'Dibayar',
      tone: 'success',
      helper: 'Nominal cicilan sudah dilunasi melalui proses pembayaran payroll.',
    },
    DILEWATI: {
      label: 'Dilewati',
      tone: 'danger',
      helper: 'Cicilan terlewat dan belum dibayar.',
    },
  };

  return (
    map[normalized] || {
      label: normalized || '-',
      tone: 'neutral',
      helper: 'Status cicilan belum dipetakan.',
    }
  );
}

export function getUserDisplayName(user) {
  return normalizeText(user?.nama_pengguna || user?.nama || user?.name || user?.email || user?.id_user) || '-';
}

export function getUserIdentity(user) {
  return normalizeText(user?.nomor_induk_karyawan || user?.email || user?.id_user) || '-';
}

export function getUserDepartment(user) {
  return normalizeText(user?.departement?.nama_departement || user?.divisi) || '';
}

export function getUserRoleOrJob(user) {
  return normalizeText(user?.jabatan?.nama_jabatan || user?.role) || '';
}

export function getUserPhoto(user) {
  const raw = normalizeText(user?.foto_profil_user);
  return raw || null;
}

export function calculateOutstandingAmount(item) {
  const nominalTagihan = toNumber(item?.nominal_tagihan);
  const nominalTerbayar = toNumber(item?.nominal_terbayar);
  const outstanding = nominalTagihan - nominalTerbayar;

  if (outstanding < 0) return 0;
  return outstanding;
}
 

export function canPostToPayroll(item) {
  const status = normalizeText(item?.status_cicilan).toUpperCase();
  const linkedPayroll = Boolean(item?.id_payroll_karyawan || item?.business_state?.linked_payroll);
  const isMutable = item?.business_state?.bisa_diubah !== false;

  if (!isMutable) return false;
  if (linkedPayroll) return false;

  return status === STATUS_CICILAN.MENUNGGU || status === STATUS_CICILAN.DILEWATI;
}

export function canUnpostFromPayroll(item) {
  const status = normalizeText(item?.status_cicilan).toUpperCase();
  const linkedPayroll = Boolean(item?.id_payroll_karyawan || item?.business_state?.linked_payroll);
  const isMutable = item?.business_state?.bisa_diubah !== false;
  const alreadyPaid = item?.business_state?.sudah_dibayar || status === STATUS_CICILAN.DIBAYAR;

  return status === STATUS_CICILAN.DIPOSTING && linkedPayroll && isMutable && !alreadyPaid;
}
 

export function createPostPayrollPayload({ payrollId, urutanTampil = 920, catatan = '' }) {
  const parsedUrutan = Number(urutanTampil);
  const normalizedCatatan = normalizeText(catatan);

  return {
    status_cicilan: STATUS_CICILAN.DIPOSTING,
    id_payroll_karyawan: normalizeText(payrollId),
    urutan_tampil_item_payroll: Number.isFinite(parsedUrutan) ? Math.max(Math.trunc(parsedUrutan), 0) : 920,
    catatan_item_payroll: normalizedCatatan || null,
  };
}

export function buildSearchHaystack(item) {
  return [
    item?.id_cicilan_pinjaman_karyawan,
    item?.id_pinjaman_karyawan,
    item?.id_payroll_karyawan,
    item?.nama_karyawan,
    item?.identitas_karyawan,
    item?.nama_pinjaman,
    item?.status_cicilan,
    item?.periode_payroll_label,
    item?.periode_tagihan_label,
  ]
    .map(normalizeSearchText)
    .join(' ');
}

export function buildKaryawanFilterOptions(items) {
  const map = new Map();

  items.forEach((item) => {
    const value = normalizeText(item?.user?.id_user || item?.nama_karyawan);
    if (!value) return;

    if (!map.has(value)) {
      map.set(value, {
        value,
        label: item?.nama_karyawan || value,
      });
    }
  });

  return [{ value: 'ALL', label: 'Semua Karyawan' }, ...Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'id'))];
}
