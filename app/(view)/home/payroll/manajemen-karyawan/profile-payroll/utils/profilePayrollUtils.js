// app/(view)/home/payroll/manajemen-karyawan/profile-payroll/utils/profilePayrollUtils.js

export const JENIS_HUBUNGAN_OPTIONS = [
  { value: 'PKWTT', label: 'PKWTT (Tetap)' },
  { value: 'PKWT', label: 'PKWT (Kontrak)' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship / Magang' },
];

export function createInitialProfilPayrollForm() {
  return {
    subject_key: '',
    id_user: '',
    id_freelance: '',
    jenis_hubungan_kerja: 'PKWTT',
    gaji_pokok: 0,
    tunjangan_bpjs: 0,
    payroll_aktif: true,
    tanggal_mulai_payroll: '',
    catatan: '',
  };
}

export function formatCurrency(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return '-';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(parsed);
}

export function toDateInputValue(value) {
  if (!value) return '';

  const raw = String(value).trim();
  const exactDateMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);

  if (exactDateMatch) {
    return exactDateMatch[1];
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDate(value) {
  if (!value) return '-';

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatJenisHubungan(value) {
  const map = {
    PKWTT: 'PKWTT',
    PKWT: 'PKWT',
    FREELANCE: 'Freelance',
    INTERNSHIP: 'Internship / Magang',
  };

  return map[value] || value || '-';
}

export function getUserDisplayName(user) {
  return user?.nama_pengguna || user?.nama || user?.name || user?.email || 'Karyawan';
}

export function getUserIdentity(user) {
  return user?.nomor_induk_karyawan || user?.email || user?.id_user || user?.id_freelance || '-';
}

export function getUserSelectLabel(user) {
  const name = getUserDisplayName(user);
  const identity = getUserIdentity(user);

  return [name, identity && identity !== '-' ? identity : null].filter(Boolean).join(' - ');
}

export function getUserRoleOrJob(user) {
  return user?.jabatan?.nama_jabatan || user?.role || (user?.id_freelance ? 'Freelance' : '-');
}

export function getUserDepartment(user) {
  return user?.departement?.nama_departement || user?.divisi || '-';
}

export function getUserPhoto(user) {
  return user?.foto_profil_user || user?.avatarUrl || user?.foto || user?.foto_url || user?.photoUrl || user?.photo || user?.avatar || user?.gambar || null;
}
