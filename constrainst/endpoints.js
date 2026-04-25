// Small QS helper (skip null/empty)
function buildQS(obj = {}) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s !== '') p.set(k, s);
  });
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

// Location
const API_LOCATION = '/api/admin/location';
// Departement
const API_DEPARTEMENT = '/api/admin/departements';
// Users & Auth
const API_USERS = '/api/admin/users';
const API_RESET_PASSWORD_REQUEST = '/api/mobile/auth/reset-password/request-token';
const API_RESET_PASSWORD_CONFIRM = '/api/mobile/auth/reset-password';
const API_REGISTER = '/api/mobile/auth/register';

// NEW: Agenda (master aktivitas) & Agenda Kerja
const API_AGENDA = '/api/admin/agenda';
const API_AGENDA_KERJA = '/api/admin/agenda-kerja-admin';
const API_AGENDA_KERJA_IMPORT = '/api/admin/agenda-kerja-admin/import';
const API_AGENDA_KERJA_IMPORT_TEMPLATE = '/api/admin/agenda-kerja-admin/import/template';

// === NEW: Jabatan
const API_JABATAN = "/api/admin/jabatans";
const API_KPI_PLANS = "/api/admin/kpi-plans";

// POLA & SHIFT KERJA
const API_POLA_KERJA = "/api/admin/pola-kerja";
const API_SHIFT_KERJA = "/api/admin/shift-kerja";
const API_SHIFT_KERJA_USER = "/api/admin/shift-kerja/user";
const API_REPORT_SALES_WEEKLY = "/api/admin/reports/sales-weekly";
const API_REPORT_FREELANCE_WEEKLY = "/api/admin/reports/freelance-weekly";


// === NEW: Absensi
const API_ABSENSI_RECORDS = "/api/admin/absensi/history";
const API_ABSENSI_APPROVALS = "/api/admin/absensi";
const API_LEMBUR = "/api/admin/lembur";

// === Kunjungan
const API_KUNJUNGAN = '/api/admin/kunjungan-klien-admin';

// === Kategori Kunjungan
const API_KATEGORI_KUNJUNGAN = '/api/admin/kategori-kunjungan';

/* === BARU: KATEGORI CUTI & KATEGORI SAKIT === */
const API_KATEGORI_CUTI = '/api/admin/kategori-cuti';
const API_KATEGORI_SAKIT = '/api/admin/kategori-sakit';

const API_CUTI_KONFIG = '/api/admin/cuti-konfigurasi';
const API_CUTI_KONFIG_MATRIX = '/api/admin/cuti-konfigurasi/matrix';

const API_KATEGORI_IZIN_JAM = '/api/admin/kategori-izin-jam';

// === Mobile: CUTI
const API_MOBILE_PENGAJUAN_CUTI = '/api/mobile/pengajuan-cuti';
const API_MOBILE_PENGAJUAN_CUTI_APPROVALS = '/api/mobile/pengajuan-cuti/approvals';

// === Mobile: IZIN JAM
const API_MOBILE_IZIN_JAM = '/api/mobile/pengajuan-izin-jam';
const API_MOBILE_IZIN_JAM_APPROVALS = '/api/mobile/pengajuan-izin-jam/approvals';

// === Mobile: SAKIT
const API_MOBILE_IZIN_SAKIT = '/api/mobile/pengajuan-izin-sakit';
const API_MOBILE_IZIN_SAKIT_APPROVALS = '/api/mobile/pengajuan-izin-sakit/approvals';

// === Mobile: TUKAR HARI
const API_MOBILE_TUKAR_HARI = '/api/mobile/pengajuan-izin-tukar-hari';
const API_MOBILE_TUKAR_HARI_APPROVALS = '/api/mobile/pengajuan-izin-tukar-hari/approvals';

// base path
const API_NOTIFICATIONS = '/api/notifications';
const API_NOTIFICATIONS_RECENT = '/api/notifications/recent';
const API_NOTIFICATIONS_MARK_ALL = '/api/notifications/mark-all-as-read';

// === Story Planner
const API_STORY_PLANNER = '/api/admin/story-planner';

// === Finance Mobile
const API_MOBILE_POCKET_MONEY = '/api/mobile/pocket-money';
const API_MOBILE_REIMBURSE = '/api/mobile/reimburse';
const API_MOBILE_PAYMENT = '/api/mobile/payment';

// === SOP Admin
const API_SOP_PERUSAHAAN = '/api/admin/sop-perusahaan';

const API_KATEGORI_SOP = '/api/admin/kategori-sop';

// === Payroll Admin
const API_MASTER_TEMPLATE = '/api/admin/master-template';
const API_TARIF_PAJAK_TER = '/api/admin/tarif-pajak-ter';
const API_PROFIL_PAYROLL = '/api/admin/profil-payroll';
const API_TIPE_KOMPONEN_PAYROLL = '/api/admin/tipe-komponen-payroll';
const API_DEFINISI_KOMPONEN_PAYROLL = '/api/admin/definisi-komponen-payroll';
const API_PRODUK_KONSULTAN = '/api/admin/produk-konsultan';
const API_RIWAYAT_KOMPENSASI_KARYAWAN = '/api/admin/riwayat-kompensasi-karyawan';
const API_PERIODE_KONSULTAN = '/api/admin/periode-konsultan';
const API_PERIODE_PAYROLL = '/api/admin/periode-payroll';
const API_PAYROLL_KARYAWAN = '/api/admin/payroll-karyawan';
const API_PERSETUJUAN_PERIODE_PAYROLL = '/api/admin/persetujuan-periode-payroll';
const API_TRANSAKSI_KONSULTAN = '/api/admin/transaksi-konsultan';
const API_PAYOUT_KONSULTAN = '/api/admin/payout-konsultan';
const API_PAYOUT_KONSULTAN_DETAIL = '/api/admin/payout-konsultan-detail';

// ===== Finance: Kategori Keperluan (Admin)
const API_KATEGORI_KEPERLUAN = "/api/admin/kategori-keperluan";
const API_FREELANCE = "/api/admin/freelance";
const API_PUBLIC_FREELANCE_FORM = "/api/public/freelance-form";
const API_FREELANCE_FORM_ADMIN = "/api/admin/freelance/forms";

export const ApiEndpoints = {
  // Location
  GetLocation: API_LOCATION,
  CreateLocation: API_LOCATION,
  GetLocationById: (id) => `${API_LOCATION}/${id}`,
  UpdateLocation: (id) => `${API_LOCATION}/${id}`,
  DeleteLocation: (id) => `${API_LOCATION}/${id}`,

  // Departement
  GetDepartement: API_DEPARTEMENT,
  CreateDepartement: API_DEPARTEMENT,
  GetDepartementById: (id) => `${API_DEPARTEMENT}/${id}`,
  GetDepartementByUser: (id) => `${API_DEPARTEMENT}/${id}/users`,
  UpdateDepartement: (id) => `${API_DEPARTEMENT}/${id}`,
  DeleteDepartement: (id) => `${API_DEPARTEMENT}/${id}`,

  // Reset Password
  ResetPasswordRequest: API_RESET_PASSWORD_REQUEST,
  ResetPasswordConfirm: API_RESET_PASSWORD_CONFIRM,

  // Users
  GetUsers: API_USERS,
  CreateUser: API_REGISTER, // create pakai REGISTER
  GetUserById: (id) => `${API_USERS}/${id}`,
  UpdateUser: (id) => `${API_USERS}/${id}`,
  DeleteUser: (id) => `${API_USERS}/${id}`,

  // Agenda (master)
  GetAgenda: API_AGENDA,
  CreateAgenda: API_AGENDA,
  GetAgendaById: (id) => `${API_AGENDA}/${id}`,
  UpdateAgenda: (id) => `${API_AGENDA}/${id}`,
  DeleteAgenda: (id) => `${API_AGENDA}/${id}`,

  // Agenda Kerja (jadwal kerja)
  GetAgendaKerja: API_AGENDA_KERJA,
  CreateAgendaKerja: API_AGENDA_KERJA,
  GetAgendaKerjaById: (id) => `${API_AGENDA_KERJA}/${id}`,
  UpdateAgendaKerja: (id) => `${API_AGENDA_KERJA}/${id}`,
  DeleteAgendaKerja: (id) => `${API_AGENDA_KERJA}/${id}`,
  ImportAgendaKerja: API_AGENDA_KERJA_IMPORT,
  ImportAgendaKerjaTemplate: API_AGENDA_KERJA_IMPORT_TEMPLATE,

  // Jabatan
  GetJabatan: API_JABATAN,
  CreateJabatan: API_JABATAN,
  GetJabatanById: (id) => `${API_JABATAN}/${id}`,
  UpdateJabatan: (id) => `${API_JABATAN}/${id}`,
  DeleteJabatan: (id) => `${API_JABATAN}/${id}`,

  // KPI Plans
  GetKpiPlans: (qsObj = {}) => `${API_KPI_PLANS}${buildQS(qsObj)}`,
  CreateKpiPlan: API_KPI_PLANS,
  GetKpiPlanById: (id) => `${API_KPI_PLANS}/${id}`,
  UpdateKpiPlan: (id) => `${API_KPI_PLANS}/${id}`,
  DeleteKpiPlan: (id) => `${API_KPI_PLANS}/${id}`,

  // Pola Kerja
  GetPolaKerja: API_POLA_KERJA,
  CreatePolaKerja: API_POLA_KERJA,
  GetPolaKerjaById: (id) => `${API_POLA_KERJA}/${id}`,
  UpdatePolaKerja: (id) => `${API_POLA_KERJA}/${id}`,
  DeletePolaKerja: (id) => `${API_POLA_KERJA}/${id}`,

  // Shift Kerja
  GetShiftKerja: API_SHIFT_KERJA,
  CreateShiftKerja: API_SHIFT_KERJA,
  GetShiftKerjaById: (id) => `${API_SHIFT_KERJA}/${id}`,
  UpdateShiftKerja: (id) => `${API_SHIFT_KERJA}/${id}`,
  DeleteShiftKerja: (id) => `${API_SHIFT_KERJA}/${id}`,
  GetShiftKerjaByUser: (userId) => `${API_SHIFT_KERJA_USER}/${userId}`,
  GetSalesWeeklyReport: (qsObj = {}) => `${API_REPORT_SALES_WEEKLY}${buildQS(qsObj)}`,
  GetFreelanceWeeklyReport: (qsObj = {}) => `${API_REPORT_FREELANCE_WEEKLY}${buildQS(qsObj)}`,

  // Absensi
  GetAbsensiRecords: (qsObj = {}) => `${API_ABSENSI_RECORDS}${buildQS(qsObj)}`,
  GetAbsensiApprovals: (qsObj = {}) => `${API_ABSENSI_APPROVALS}${buildQS(qsObj)}`,
  UpdateAbsensiApproval: (id) => `${API_ABSENSI_APPROVALS}/${id}`,
  GetLembur: (qsObj = {}) => `${API_LEMBUR}${buildQS(qsObj)}`,

  // Kunjungan
  GetKunjungan: API_KUNJUNGAN,
  CreateKunjungan: API_KUNJUNGAN,
  GetKunjunganById: (id) => `${API_KUNJUNGAN}/${id}`,
  UpdateKunjungan: (id) => `${API_KUNJUNGAN}/${id}`,
  DeleteKunjungan: (id) => `${API_KUNJUNGAN}/${id}`,

  // Kategori Kunjungan
  GetKategoriKunjungan: API_KATEGORI_KUNJUNGAN,
  CreateKategoriKunjungan: API_KATEGORI_KUNJUNGAN,
  GetKategoriKunjunganById: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}`,
  UpdateKategoriKunjungan: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}`,
  DeleteKategoriKunjungan: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}`,
  RestoreKategoriKunjungan: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}/restore`,

  // Kategori Cuti
  GetKategoriCuti: API_KATEGORI_CUTI,
  CreateKategoriCuti: API_KATEGORI_CUTI,
  GetKategoriCutiById: (id) => `${API_KATEGORI_CUTI}/${id}`,
  UpdateKategoriCuti: (id) => `${API_KATEGORI_CUTI}/${id}`,
  DeleteKategoriCuti: (id) => `${API_KATEGORI_CUTI}/${id}`,

  // Kategori Sakit
  GetKategoriSakit: API_KATEGORI_SAKIT,
  CreateKategoriSakit: API_KATEGORI_SAKIT,
  GetKategoriSakitById: (id) => `${API_KATEGORI_SAKIT}/${id}`,
  UpdateKategoriSakit: (id) => `${API_KATEGORI_SAKIT}/${id}`,
  DeleteKategoriSakit: (id) => `${API_KATEGORI_SAKIT}/${id}`,

  // Freelance
  GetFreelance: (qsObj = {}) => `${API_FREELANCE}${buildQS(qsObj)}`,
  CreateFreelance: API_FREELANCE,
  GetFreelanceById: (id) => `${API_FREELANCE}/${id}`,
  UpdateFreelance: (id) => `${API_FREELANCE}/${id}`,
  DeleteFreelance: (id) => `${API_FREELANCE}/${id}`,
  GetPublicFreelanceForm: (id) => `${API_PUBLIC_FREELANCE_FORM}/${id}`,
  SubmitPublicFreelanceForm: (id) => `${API_PUBLIC_FREELANCE_FORM}/${id}`,
  UpdateFreelanceFormApproval: (id) => `${API_FREELANCE_FORM_ADMIN}/${id}`,

  // Cuti Konfigurasi
  GetCutiKonfigurasi: API_CUTI_KONFIG,
  CreateCutiKonfigurasi: API_CUTI_KONFIG,
  GetCutiKonfigurasiById: (id) => `${API_CUTI_KONFIG}/${id}`,
  UpdateCutiKonfigurasi: (id) => `${API_CUTI_KONFIG}/${id}`,
  DeleteCutiKonfigurasi: (id) => `${API_CUTI_KONFIG}/${id}`,

  GetCutiKonfigurasiMatrix: (qsObj = {}) => `${API_CUTI_KONFIG_MATRIX}${buildQS(qsObj)}`,
  SaveCutiKonfigurasiMatrix: API_CUTI_KONFIG_MATRIX,

  // Master kategori izin jam
  GetKategoriIzinJam: API_KATEGORI_IZIN_JAM,
  GetKategoriIzinJamById: (id) => `${API_KATEGORI_IZIN_JAM}/${id}`,
  CreateKategoriIzinJam: API_KATEGORI_IZIN_JAM,
  UpdateKategoriIzinJam: (id) => `${API_KATEGORI_IZIN_JAM}/${id}`,
  DeleteKategoriIzinJam: (id) => `${API_KATEGORI_IZIN_JAM}/${id}`,

  // ===== CUTI (Mobile)
  GetPengajuanCutiMobile: (qsObj = {}) => `${API_MOBILE_PENGAJUAN_CUTI}${buildQS(qsObj)}`,
  CreatePengajuanCutiMobile: API_MOBILE_PENGAJUAN_CUTI,
  GetPengajuanCutiMobileById: (id) => `${API_MOBILE_PENGAJUAN_CUTI}/${id}`,
  UpdatePengajuanCutiMobile: (id) => `${API_MOBILE_PENGAJUAN_CUTI}/${id}`,
  DeletePengajuanCutiMobile: (id) => `${API_MOBILE_PENGAJUAN_CUTI}/${id}`,
  // Approvals by PATH param
  DecidePengajuanCutiMobile: (approvalId) => `${API_MOBILE_PENGAJUAN_CUTI_APPROVALS}/${approvalId}`,

  // ===== IZIN JAM (Mobile)
  GetPengajuanIzinJamMobile: (qsObj = {}) => `${API_MOBILE_IZIN_JAM}${buildQS(qsObj)}`,
  CreatePengajuanIzinJamMobile: API_MOBILE_IZIN_JAM,
  GetPengajuanIzinJamMobileById: (id) => `${API_MOBILE_IZIN_JAM}/${id}`,
  UpdatePengajuanIzinJamMobile: (id) => `${API_MOBILE_IZIN_JAM}/${id}`,
  DeletePengajuanIzinJamMobile: (id) => `${API_MOBILE_IZIN_JAM}/${id}`,
  DecidePengajuanIzinJamMobile: (approvalId) => `${API_MOBILE_IZIN_JAM_APPROVALS}/${approvalId}`,

  // ===== IZIN SAKIT (Mobile)
  GetPengajuanIzinSakitMobile: (qsObj = {}) => `${API_MOBILE_IZIN_SAKIT}${buildQS(qsObj)}`,
  CreatePengajuanIzinSakitMobile: API_MOBILE_IZIN_SAKIT,
  GetPengajuanIzinSakitMobileById: (id) => `${API_MOBILE_IZIN_SAKIT}/${id}`,
  UpdatePengajuanIzinSakitMobile: (id) => `${API_MOBILE_IZIN_SAKIT}/${id}`,
  DeletePengajuanIzinSakitMobile: (id) => `${API_MOBILE_IZIN_SAKIT}/${id}`,
  DecidePengajuanIzinSakitMobile: (approvalId) => `${API_MOBILE_IZIN_SAKIT_APPROVALS}/${approvalId}`,

  // ===== TUKAR HARI (Mobile)
  GetPengajuanTukarHariMobile: (qsObj = {}) => `${API_MOBILE_TUKAR_HARI}${buildQS(qsObj)}`,
  CreatePengajuanTukarHariMobile: API_MOBILE_TUKAR_HARI,
  GetPengajuanTukarHariDetail: (id) => `${API_MOBILE_TUKAR_HARI}/${id}`, // <— dipakai FE fallback
  UpdatePengajuanTukarHariMobile: (id) => `${API_MOBILE_TUKAR_HARI}/${id}`,
  DeletePengajuanTukarHariMobile: (id) => `${API_MOBILE_TUKAR_HARI}/${id}`,
  DecidePengajuanTukarHariMobile: (approvalId) => `${API_MOBILE_TUKAR_HARI_APPROVALS}/${approvalId}`,

  // ===== NOTIFICATIONS (user/mobile) =====
  GetNotifications: (qsObj = {}) => `${API_NOTIFICATIONS}${buildQS(qsObj)}`,
  GetNotificationsRecent: (qsObj = {}) => `${API_NOTIFICATIONS_RECENT}${buildQS(qsObj)}`,
  MarkAllNotificationsRead: API_NOTIFICATIONS_MARK_ALL,
  MarkNotificationRead: (id) => `${API_NOTIFICATIONS}/${id}`,

  // ===== NOTIFICATIONS ADMIN (alias ke yang sama) =====
  GetAdminNotifications: (qsObj = {}) => `${API_NOTIFICATIONS}${buildQS(qsObj)}`,
  GetAdminNotificationsRecent: (qsObj = {}) => `${API_NOTIFICATIONS_RECENT}${buildQS(qsObj)}`,
  MarkAllAdminNotificationsRead: API_NOTIFICATIONS_MARK_ALL,
  MarkAdminNotificationRead: (id) => `${API_NOTIFICATIONS}/${id}`,

  // Story Planner
  GetStoryPlanner: API_STORY_PLANNER,
  CreateStoryPlanner: API_STORY_PLANNER,
  GetStoryPlannerById: (id) => `${API_STORY_PLANNER}/${id}`,
  UpdateStoryPlanner: (id) => `${API_STORY_PLANNER}/${id}`,
  DeleteStoryPlanner: (id) => `${API_STORY_PLANNER}/${id}`,

  // ===== FINANCE (Mobile) =====
  GetPocketMoneyMobile: (qsObj = {}) => `${API_MOBILE_POCKET_MONEY}${buildQS(qsObj)}`,
  DecidePocketMoneyMobile: (approvalId) => `${API_MOBILE_POCKET_MONEY}/approvals/${approvalId}`,

  GetReimburseMobile: (qsObj = {}) => `${API_MOBILE_REIMBURSE}${buildQS(qsObj)}`,
  DecideReimburseMobile: (approvalId) => `${API_MOBILE_REIMBURSE}/approvals/${approvalId}`,

  GetPaymentMobile: (qsObj = {}) => `${API_MOBILE_PAYMENT}${buildQS(qsObj)}`,
  DecidePaymentMobile: (approvalId) => `${API_MOBILE_PAYMENT}/approvals/${approvalId}`,
  RestoreKategoriKeperluan: (id) => `${API_KATEGORI_KEPERLUAN}/${id}/restore`,

  // ===== SOP (Admin) =====
  GetSOPPerusahaan: (qsObj = {}) => `${API_SOP_PERUSAHAAN}${buildQS(qsObj)}`,
  CreateSOPPerusahaan: () => API_SOP_PERUSAHAAN,
  GetSOPPerusahaanById: (id) => `${API_SOP_PERUSAHAAN}/${id}`,
  UpdateSOPPerusahaan: (id) => `${API_SOP_PERUSAHAAN}/${id}`,
  DeleteSOPPerusahaan: (id) => `${API_SOP_PERUSAHAAN}/${id}`,

  GetKategoriSOP: (qsObj = {}) => `${API_KATEGORI_SOP}${buildQS(qsObj)}`,
  CreateKategoriSOP: API_KATEGORI_SOP,
  GetKategoriSOPById: (id) => `${API_KATEGORI_SOP}/${id}`,
  UpdateKategoriSOP: (id) => `${API_KATEGORI_SOP}/${id}`,
  DeleteKategoriSOP: (id) => `${API_KATEGORI_SOP}/${id}`,

  // ===== MASTER TEMPLATE (Admin) =====
  GetMasterTemplate: (qsObj = {}) => `${API_MASTER_TEMPLATE}${buildQS(qsObj)}`,
  CreateMasterTemplate: () => API_MASTER_TEMPLATE,
  GetMasterTemplateById: (id) => `${API_MASTER_TEMPLATE}/${id}`,
  UpdateMasterTemplate: (id) => `${API_MASTER_TEMPLATE}/${id}`,
  DeleteMasterTemplate: (id) => `${API_MASTER_TEMPLATE}/${id}`,

  /* ===== KATEGORI FINANCE (ADMIN) ===== */
  GetKategoriKeperluan: (qsObj = {}) => `${API_KATEGORI_KEPERLUAN}${buildQS(qsObj)}`,
  CreateKategoriKeperluan: API_KATEGORI_KEPERLUAN,
  GetKategoriKeperluanById: (id) => `${API_KATEGORI_KEPERLUAN}/${id}`,
  UpdateKategoriKeperluan: (id) => `${API_KATEGORI_KEPERLUAN}/${id}`,
  DeleteKategoriKeperluan: (id) => `${API_KATEGORI_KEPERLUAN}/${id}`,

  // ===== TARIF PAJAK TER (Admin) =====
  GetTarifPajakTER: (qsObj = {}) => `${API_TARIF_PAJAK_TER}${buildQS(qsObj)}`,
  CreateTarifPajakTER: () => API_TARIF_PAJAK_TER,
  GetTarifPajakTERById: (id) => `${API_TARIF_PAJAK_TER}/${id}`,
  UpdateTarifPajakTER: (id) => `${API_TARIF_PAJAK_TER}/${id}`,
  DeleteTarifPajakTER: (id) => `${API_TARIF_PAJAK_TER}/${id}`,

  // ===== PROFIL PAYROLL (Admin) =====
  GetProfilPayroll: (qsObj = {}) => `${API_PROFIL_PAYROLL}${buildQS(qsObj)}`,
  CreateProfilPayroll: () => API_PROFIL_PAYROLL,
  GetProfilPayrollById: (id) => `${API_PROFIL_PAYROLL}/${id}`,
  UpdateProfilPayroll: (id) => `${API_PROFIL_PAYROLL}/${id}`,
  DeleteProfilPayroll: (id) => `${API_PROFIL_PAYROLL}/${id}`,

  // ===== DEFINISI KOMPONEN PAYROLL (Admin) =====
  GetDefinisiKomponenPayroll: (qsObj = {}) => `${API_DEFINISI_KOMPONEN_PAYROLL}${buildQS(qsObj)}`,
  CreateDefinisiKomponenPayroll: () => API_DEFINISI_KOMPONEN_PAYROLL,
  GetDefinisiKomponenPayrollById: (id) => `${API_DEFINISI_KOMPONEN_PAYROLL}/${id}`,
  UpdateDefinisiKomponenPayroll: (id) => `${API_DEFINISI_KOMPONEN_PAYROLL}/${id}`,
  DeleteDefinisiKomponenPayroll: (id) => `${API_DEFINISI_KOMPONEN_PAYROLL}/${id}`,

  // ===== TIPE KOMPONEN PAYROLL (Admin) =====
  GetTipeKomponenPayroll: (qsObj = {}) => `${API_TIPE_KOMPONEN_PAYROLL}${buildQS(qsObj)}`,
  CreateTipeKomponenPayroll: () => API_TIPE_KOMPONEN_PAYROLL,
  GetTipeKomponenPayrollById: (id) => `${API_TIPE_KOMPONEN_PAYROLL}/${id}`,
  UpdateTipeKomponenPayroll: (id) => `${API_TIPE_KOMPONEN_PAYROLL}/${id}`,
  DeleteTipeKomponenPayroll: (id) => `${API_TIPE_KOMPONEN_PAYROLL}/${id}`,

  // ===== PRODUK KONSULTAN (Admin) =====
  GetProdukKonsultan: (qsObj = {}) => `${API_PRODUK_KONSULTAN}${buildQS(qsObj)}`,
  CreateProdukKonsultan: () => API_PRODUK_KONSULTAN,
  GetProdukKonsultanById: (id) => `${API_PRODUK_KONSULTAN}/${id}`,
  UpdateProdukKonsultan: (id) => `${API_PRODUK_KONSULTAN}/${id}`,
  DeleteProdukKonsultan: (id, qsObj = {}) => `${API_PRODUK_KONSULTAN}/${id}${buildQS(qsObj)}`,

  // ===== RIWAYAT KOMPENSASI KARYAWAN (Admin) =====
  GetRiwayatKompensasiKaryawan: (qsObj = {}) => `${API_RIWAYAT_KOMPENSASI_KARYAWAN}${buildQS(qsObj)}`,
  CreateRiwayatKompensasiKaryawan: () => API_RIWAYAT_KOMPENSASI_KARYAWAN,
  GetRiwayatKompensasiKaryawanById: (id) => `${API_RIWAYAT_KOMPENSASI_KARYAWAN}/${id}`,
  UpdateRiwayatKompensasiKaryawan: (id) => `${API_RIWAYAT_KOMPENSASI_KARYAWAN}/${id}`,
  DeleteRiwayatKompensasiKaryawan: (id) => `${API_RIWAYAT_KOMPENSASI_KARYAWAN}/${id}`,

  GetPeriodeKonsultan: (qsObj = {}) => `${API_PERIODE_KONSULTAN}${buildQS(qsObj)}`,
  CreatePeriodeKonsultan: () => API_PERIODE_KONSULTAN,
  GetPeriodeKonsultanById: (id) => `${API_PERIODE_KONSULTAN}/${id}`,
  UpdatePeriodeKonsultan: (id) => `${API_PERIODE_KONSULTAN}/${id}`,
  DeletePeriodeKonsultan: (id, qsObj = {}) => `${API_PERIODE_KONSULTAN}/${id}${buildQS(qsObj)}`,

  GetPeriodePayroll: (qsObj = {}) => `${API_PERIODE_PAYROLL}${buildQS(qsObj)}`,
  CreatePeriodePayroll: () => API_PERIODE_PAYROLL,
  GetPeriodePayrollById: (id) => `${API_PERIODE_PAYROLL}/${id}`,
  UpdatePeriodePayroll: (id) => `${API_PERIODE_PAYROLL}/${id}`,
  DeletePeriodePayroll: (id, qsObj = {}) => `${API_PERIODE_PAYROLL}/${id}${buildQS(qsObj)}`,

  GetPayrollKaryawan: (qsObj = {}) => `${API_PAYROLL_KARYAWAN}${buildQS(qsObj)}`,
  CreatePayrollKaryawan: () => API_PAYROLL_KARYAWAN,
  GetPayrollKaryawanById: (id) => `${API_PAYROLL_KARYAWAN}/${id}`,
  GetPayrollSlipKaryawanById: (id) => `${API_PAYROLL_KARYAWAN}/${id}/slip`,
  GetPayrollSlipPdfKaryawanById: (id) => `${API_PAYROLL_KARYAWAN}/${id}/slip/pdf`,
  UpdatePayrollKaryawan: (id) => `${API_PAYROLL_KARYAWAN}/${id}`,
  UploadBuktiBayarPayrollKaryawan: (id) => `${API_PAYROLL_KARYAWAN}/${id}`,
  DeletePayrollKaryawan: (id, qsObj = {}) => `${API_PAYROLL_KARYAWAN}/${id}${buildQS(qsObj)}`,
  ApprovePayrollKaryawan: (approvalId) => `${API_PAYROLL_KARYAWAN}/approvals/${approvalId}`,

  GetPersetujuanPeriodePayroll: (qsObj = {}) => `${API_PERSETUJUAN_PERIODE_PAYROLL}${buildQS(qsObj)}`,
  CreatePersetujuanPeriodePayroll: () => API_PERSETUJUAN_PERIODE_PAYROLL,
  GetPersetujuanPeriodePayrollById: (id) => `${API_PERSETUJUAN_PERIODE_PAYROLL}/${id}`,
  UpdatePersetujuanPeriodePayroll: (id) => `${API_PERSETUJUAN_PERIODE_PAYROLL}/${id}`,
  DeletePersetujuanPeriodePayroll: (id, qsObj = {}) => `${API_PERSETUJUAN_PERIODE_PAYROLL}/${id}${buildQS(qsObj)}`,

  GetTransaksiKonsultan: (qsObj = {}) => `${API_TRANSAKSI_KONSULTAN}${buildQS(qsObj)}`,
  CreateTransaksiKonsultan: () => API_TRANSAKSI_KONSULTAN,
  GetTransaksiKonsultanById: (id) => `${API_TRANSAKSI_KONSULTAN}/${id}`,
  UpdateTransaksiKonsultan: (id) => `${API_TRANSAKSI_KONSULTAN}/${id}`,
  DeleteTransaksiKonsultan: (id, qsObj = {}) => `${API_TRANSAKSI_KONSULTAN}/${id}${buildQS(qsObj)}`,
  PreviewImportTransaksiKonsultan: () => `${API_TRANSAKSI_KONSULTAN}/import/preview`,
  CommitImportTransaksiKonsultan: () => `${API_TRANSAKSI_KONSULTAN}/import/commit`,

  GetPayoutKonsultan: (qsObj = {}) => `${API_PAYOUT_KONSULTAN}${buildQS(qsObj)}`,
  CreatePayoutKonsultan: () => API_PAYOUT_KONSULTAN,
  GetPayoutKonsultanById: (id) => `${API_PAYOUT_KONSULTAN}/${id}`,
  UpdatePayoutKonsultan: (id) => `${API_PAYOUT_KONSULTAN}/${id}`,
  UnpostPayoutKonsultan: (id) => `${API_PAYOUT_KONSULTAN}/${id}/unpost`,
  DeletePayoutKonsultan: (id, qsObj = {}) => `${API_PAYOUT_KONSULTAN}/${id}${buildQS(qsObj)}`,

  GetPayoutKonsultanDetail: (qsObj = {}) => `${API_PAYOUT_KONSULTAN_DETAIL}${buildQS(qsObj)}`,
  CreatePayoutKonsultanDetail: () => API_PAYOUT_KONSULTAN_DETAIL,
  GetPayoutKonsultanDetailById: (id) => `${API_PAYOUT_KONSULTAN_DETAIL}/${id}`,
  UpdatePayoutKonsultanDetail: (id) => `${API_PAYOUT_KONSULTAN_DETAIL}/${id}`,
  DeletePayoutKonsultanDetail: (id, qsObj = {}) => `${API_PAYOUT_KONSULTAN_DETAIL}/${id}${buildQS(qsObj)}`,
};
