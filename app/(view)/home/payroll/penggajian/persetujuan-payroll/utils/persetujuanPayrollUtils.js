import { formatDate, formatDateTime, formatPeriodePayrollLabel, toDateTimeLocalValue } from '../../periode-payroll/utils/periodePayrollUtils';

export { formatDate, formatDateTime, formatPeriodePayrollLabel, toDateTimeLocalValue };

export const KEPUTUSAN_PERSETUJUAN_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

export const ROLE_PENYETUJU_OPTIONS = [
  { value: 'HR', label: 'HR' },
  { value: 'DIREKTUR', label: 'Direktur' },
  { value: 'SUPERADMIN', label: 'Superadmin' },
  { value: 'OPERASIONAL', label: 'Operasional' },
  { value: 'SUBADMIN', label: 'Subadmin' },
  { value: 'SUPERVISI', label: 'Supervisi' },
  { value: 'KARYAWAN', label: 'Karyawan' },
];

const KEPUTUSAN_LABEL_MAP = KEPUTUSAN_PERSETUJUAN_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const ROLE_LABEL_MAP = ROLE_PENYETUJU_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export function createInitialPersetujuanPayrollForm() {
  return {
    id_periode_payroll: '',
    level: 1,
    id_user_penyetuju: '',
    role_penyetuju: '',
    keputusan: 'pending',
    diputuskan_pada: '',
    catatan: '',
  };
}

export function formatKeputusanPersetujuan(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return KEPUTUSAN_LABEL_MAP[normalized] || value || '-';
}

export function getKeputusanMeta(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  const map = {
    pending: {
      label: 'Pending',
      tone: 'warning',
      helper: 'Approval masih menunggu keputusan penyetuju.',
    },
    disetujui: {
      label: 'Disetujui',
      tone: 'success',
      helper: 'Approval sudah diberikan dan periode dapat melanjutkan proses berikutnya.',
    },
    ditolak: {
      label: 'Ditolak',
      tone: 'danger',
      helper: 'Approval ditolak dan membutuhkan tindak lanjut operasional.',
    },
  };

  return map[normalized] || map.pending;
}

export function formatRolePenyetuju(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();

  return ROLE_LABEL_MAP[normalized] || value || '-';
}

export function buildApproverDisplayName(record) {
  if (!record) return '-';

  const namaUser = String(record?.penyetuju?.nama_pengguna || '').trim();
  const role = formatRolePenyetuju(record?.role_penyetuju);

  if (namaUser && role && role !== '-') {
    return `${namaUser} (${role})`;
  }

  if (namaUser) return namaUser;
  if (role && role !== '-') return `Role ${role}`;

  return '-';
}

export function serializePersetujuanPayrollPayload(formData) {
  const keputusan = String(formData?.keputusan || 'pending')
    .trim()
    .toLowerCase();

  const diputuskan_pada_raw = String(formData?.diputuskan_pada || '').trim();

  return {
    id_periode_payroll: String(formData?.id_periode_payroll || '').trim(),
    level: Number(formData?.level),
    id_user_penyetuju: String(formData?.id_user_penyetuju || '').trim() || null,
    role_penyetuju: String(formData?.role_penyetuju || '')
      .trim()
      .toUpperCase() || null,
    keputusan,
    diputuskan_pada: keputusan === 'pending' ? null : diputuskan_pada_raw || null,
    catatan: String(formData?.catatan || '').trim() || null,
  };
}
