'use client';

export const STATUS_PAYROLL_OPTIONS = [
  { value: 'DRAFT', label: 'Belum Final' },
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'DIBAYAR', label: 'Dibayar' },
];

export const EDITABLE_STATUS_PAYROLL_OPTIONS = STATUS_PAYROLL_OPTIONS.filter((option) => option.value !== 'DIBAYAR');

export const STATUS_APPROVAL_OPTIONS = [
  { value: 'pending', label: 'Menunggu Persetujuan' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
];

export const JENIS_HUBUNGAN_OPTIONS = [
  { value: 'PKWTT', label: 'PKWTT' },
  { value: 'PKWT', label: 'PKWT' },
  { value: 'FREELANCE', label: 'Pekerja Lepas' },
  { value: 'INTERNSHIP', label: 'Magang' },
];

function createApprovalStepKey() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyApprovalStep() {
  return {
    client_key: createApprovalStepKey(),
    approver_user_id: '',
  };
}

export function createInitialPayrollKaryawanForm(defaultPeriode = '') {
  return {
    id_periode_payroll: defaultPeriode,
    id_user: '',
    id_freelance: '',
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
    nama_pemilik_rekening_snapshot: '',
    gaji_pokok_snapshot: 0,
    issue_number: '',
    issued_at: '',
    company_name_snapshot: '',
    tunjangan_bpjs_snapshot: 0,
    total_pendapatan_tetap: 0,
    total_pendapatan_variabel: 0,
    total_bruto_kena_pajak: 0,
    persen_pajak: 0,
    total_pajak: 0,
    total_potongan_lain: 0,
    total_dibayarkan: 0,
    status_payroll: 'DRAFT',
    status_approval: 'pending',
    current_level_approval: 1,
    approval_steps: [createEmptyApprovalStep()],
    catatan: '',
  };
}

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculatePayrollPph21Nominal(totalPendapatanBruto, persenTarifSnapshot) {
  const bruto = toNumber(totalPendapatanBruto);
  const persenTarif = toNumber(persenTarifSnapshot);

  if (bruto <= 0 || persenTarif <= 0) return 0;

  return Number(((bruto * persenTarif) / 100).toFixed(2));
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

export function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTimeLocalInput(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (segment) => String(segment).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  const key =
    typeof value === 'number'
      ? String(value)
      : String(value || '')
          .trim()
          .toUpperCase();
  return bulanMap[key] || '-';
}

export function formatJenisHubungan(value) {
  const map = {
    PKWTT: 'PKWTT',
    PKWT: 'PKWT',
    FREELANCE: 'Pekerja Lepas',
    INTERNSHIP: 'Magang',
  };

  return (
    map[
      String(value || '')
        .trim()
        .toUpperCase()
    ] ||
    value ||
    '-'
  );
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
      label: 'Belum Final',
      tone: 'neutral',
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
    map[
      String(status || '')
        .trim()
        .toUpperCase()
    ] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}

export function formatStatusApproval(status) {
  const map = {
    pending: {
      label: 'Menunggu Persetujuan',
      tone: 'warning',
    },
    disetujui: {
      label: 'Disetujui',
      tone: 'success',
    },
    ditolak: {
      label: 'Ditolak',
      tone: 'danger',
    },
  };

  return (
    map[
      String(status || '')
        .trim()
        .toLowerCase()
    ] || {
      label: status || '-',
      tone: 'neutral',
    }
  );
}

export function formatApproverRole(role) {
  const map = {
    KARYAWAN: 'Karyawan',
    HR: 'HR',
    OPERASIONAL: 'Operasional',
    DIREKTUR: 'Direktur',
    SUPERADMIN: 'Superadmin',
    SUBADMIN: 'Subadmin',
    SUPERVISI: 'Supervisi',
  };

  return (
    map[
      String(role || '')
        .trim()
        .toUpperCase()
    ] ||
    role ||
    '-'
  );
}

export function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

function normalizeApprovalStep(step) {
  if (!step) return null;

  const approverName = step?.approver_nama_snapshot || step?.approver?.nama_pengguna || '-';
  const decision = String(step?.decision || 'pending')
    .trim()
    .toLowerCase();

  return {
    ...step,
    approver_display_name: approverName,
    approver_role_label: formatApproverRole(step?.approver_role || step?.approver?.role),
    decision_meta: formatStatusApproval(decision),
  };
}

function buildPendingApproverSummary(pendingApprovalSteps = []) {
  const pendingNames = pendingApprovalSteps.map((step) => String(step?.approver_display_name || '').trim()).filter(Boolean);

  if (pendingNames.length === 0) return 'Semua penyetuju sudah menyetujui';
  if (pendingNames.length <= 2) return `Menunggu: ${pendingNames.join(', ')}`;

  const preview = pendingNames.slice(0, 2).join(', ');
  return `Menunggu: ${preview} +${pendingNames.length - 2} penyetuju lain`;
}

export function normalizePayrollKaryawanItem(item) {
  if (!item) return null;

  const user = item?.user || null;
  const freelance = item?.freelance || null;
  const idUser = String(item?.id_user || '').trim();
  const idFreelance = String(item?.id_freelance || '').trim();
  const gajiPokokSnapshot = toNumber(item.gaji_pokok_snapshot);
  const tunjanganBpjsSnapshot = toNumber(item.tunjangan_bpjs_snapshot);
  const totalPendapatanBruto = toNumber(item.total_pendapatan_bruto);
  const totalPotongan = toNumber(item.total_potongan);
  const pph21Nominal = toNumber(item.pph21_nominal);
  const totalPotonganLain = Math.max(totalPotongan - pph21Nominal - tunjanganBpjsSnapshot, 0);
  const totalPendapatanTetapSnapshot = gajiPokokSnapshot;
  const totalPendapatanTetap = totalPendapatanTetapSnapshot;
  const totalPendapatanVariabel = Math.max(totalPendapatanBruto - totalPendapatanTetap, 0);
  const periodeLabel = item?.periode ? formatPeriodeLabel(item.periode) : '-';
  const approvalSteps = Array.isArray(item.approvals) ? item.approvals.map(normalizeApprovalStep).filter(Boolean) : [];
  const approvalStatus = String(item?.status_approval || 'pending')
    .trim()
    .toLowerCase();
  const payrollStatus = String(item?.status_payroll || 'DRAFT')
    .trim()
    .toUpperCase();
  const hasBuktiBayar = Boolean(String(item?.bukti_bayar_url || '').trim());
  const currentApprovalLevel = Number(item?.current_level_approval || 0) || null;
  const pendingApprovalSteps = approvalSteps.filter(
    (step) =>
      String(step?.decision || '')
        .trim()
        .toLowerCase() === 'pending',
  );
  const currentApprovalStep = pendingApprovalSteps.find((step) => step.level === currentApprovalLevel) || pendingApprovalSteps[0] || approvalSteps.at(-1) || null;
  const approvedApprovalCount = approvalSteps.filter(
    (step) =>
      String(step?.decision || '')
        .trim()
        .toLowerCase() === 'disetujui',
  ).length;
  const approvalProgressLabel = approvalSteps.length > 0 ? `${approvedApprovalCount}/${approvalSteps.length} penyetuju selesai` : 'Belum ada penyetuju';
  const currentApprovalLabel =
    approvalSteps.length === 0
      ? 'Belum ada penyetuju'
      : approvalStatus === 'disetujui'
        ? 'Semua penyetuju sudah menyetujui'
        : approvalStatus === 'ditolak'
          ? 'Penggajian ditolak oleh penyetuju'
          : buildPendingApproverSummary(pendingApprovalSteps);

  return {
    ...item,
    subject_type: idFreelance ? 'FREELANCE' : 'USER',
    subject_key: idFreelance ? `FREELANCE:${idFreelance}` : idUser ? `USER:${idUser}` : '',
    nama_karyawan_snapshot: item.nama_karyawan || user?.nama_pengguna || freelance?.nama || '-',
    jenis_hubungan_snapshot: item.jenis_hubungan_kerja || '',
    nama_departement_snapshot: user?.departement?.nama_departement || '',
    nama_jabatan_snapshot: user?.jabatan?.nama_jabatan || (idFreelance ? 'Freelance' : ''),
    nama_bank_snapshot: item.bank_name || user?.jenis_bank || freelance?.jenis_bank || '',
    nomor_rekening_snapshot: item.bank_account || user?.nomor_rekening || freelance?.nomor_rekening || '',
    nama_pemilik_rekening_snapshot: item.bank_account_holder || user?.nama_pemilik_rekening || freelance?.nama_pemilik_rekening || '',
    total_pendapatan_tetap: totalPendapatanTetap,
    total_pendapatan_variabel: totalPendapatanVariabel,
    total_bruto_kena_pajak: totalPendapatanBruto,
    persen_pajak: toNumber(item.persen_tarif_snapshot),
    total_pajak: pph21Nominal,
    total_potongan_lain: totalPotonganLain,
    total_dibayarkan: toNumber(item.pendapatan_bersih),
    periode_label: periodeLabel,
    periode_status: item?.periode?.status_periode || '',
    item_komponen_count: Number(item?._count?.item_komponen || 0),
    approval_steps: approvalSteps,
    current_approval_step: currentApprovalStep,
    approval_count: Number(item?._count?.approvals || approvalSteps.length || 0),
    status_approval: approvalStatus,
    has_bukti_bayar: hasBuktiBayar,
    can_upload_bukti_bayar: approvalStatus === 'disetujui' && payrollStatus !== 'DIBAYAR' && !hasBuktiBayar && !item.deleted_at,
    current_level_approval: currentApprovalLevel,
    approval_progress_label: approvalProgressLabel,
    current_approval_label: currentApprovalLabel,
  };
}

export function buildPayrollKaryawanPayload(formData) {
  const idUser = String(formData.id_user || '').trim();
  const idFreelance = String(formData.id_freelance || '').trim();
  const jenisHubunganKerja = idFreelance
    ? 'FREELANCE'
    : String(formData.jenis_hubungan_snapshot || 'PKWTT')
        .trim()
        .toUpperCase();
  const totalPendapatanTetap = toNumber(formData.total_pendapatan_tetap);
  const totalPendapatanVariabel = toNumber(formData.total_pendapatan_variabel);
  const totalPendapatanBruto = toNumber(formData.total_bruto_kena_pajak) || totalPendapatanTetap + totalPendapatanVariabel;
  const totalPajak = calculatePayrollPph21Nominal(totalPendapatanBruto, formData.persen_tarif_snapshot);
  const totalPotonganLain = toNumber(formData.total_potongan_lain);
  const tunjanganBpjs = toNumber(formData.tunjangan_bpjs_snapshot);
  const totalPotongan = totalPajak + totalPotonganLain + tunjanganBpjs;
  const pendapatanBersih = Math.max(totalPendapatanBruto - totalPotongan, 0);

  return {
    id_periode_payroll: String(formData.id_periode_payroll || '').trim(),
    id_user: idUser || null,
    id_freelance: idFreelance || null,
    id_tarif_pajak_ter: String(formData.id_tarif_pajak_ter || '').trim() || null,
    nama_karyawan: String(formData.nama_karyawan_snapshot || '').trim(),
    jenis_hubungan_kerja: jenisHubunganKerja,
    bank_name: String(formData.nama_bank_snapshot || '').trim() || null,
    bank_account: String(formData.nomor_rekening_snapshot || '').trim() || null,
    bank_account_holder: String(formData.nama_pemilik_rekening_snapshot || '').trim() || null,
    tunjangan_bpjs_snapshot: tunjanganBpjs,
    issued_at: String(formData.issued_at || '').trim() || null,
    company_name_snapshot: String(formData.company_name_snapshot || '').trim() || null,
    total_pendapatan_bruto: totalPendapatanBruto,
    total_potongan: totalPotongan,
    pph21_nominal: totalPajak,
    pendapatan_bersih: pendapatanBersih,
    status_payroll: String(formData.status_payroll || 'DRAFT')
      .trim()
      .toUpperCase(),
    approval_steps: Array.isArray(formData.approval_steps)
      ? formData.approval_steps.map((step, index) => ({
          level: index + 1,
          approver_user_id: String(step?.approver_user_id || '').trim(),
        }))
      : [],
    catatan: String(formData.catatan || '').trim() || null,
  };
}
