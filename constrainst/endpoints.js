// Small QS helper (skip null/empty)
function buildQS(obj = {}) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s !== "") p.set(k, s);
  });
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

// Location
const API_LOCATION = "/api/admin/location";
// Departement
const API_DEPARTEMENT = "/api/admin/departements";
// Users & Auth
const API_USERS = "/api/admin/users";
const API_RESET_PASSWORD_REQUEST = "/api/mobile/auth/reset-password/request-token";
const API_RESET_PASSWORD_CONFIRM = "/api/mobile/auth/reset-password";
const API_REGISTER = "/api/mobile/auth/register";

// NEW: Agenda (master aktivitas) & Agenda Kerja
const API_AGENDA = "/api/admin/agenda";
const API_AGENDA_KERJA = "/api/admin/agenda-kerja-admin";
const API_AGENDA_KERJA_IMPORT = "/api/admin/agenda-kerja-admin/import";
const API_AGENDA_KERJA_IMPORT_TEMPLATE = "/api/admin/agenda-kerja-admin/import/template";

// === NEW: Jabatan
const API_JABATAN = "/api/admin/jabatans";

// POLA & SHIFT KERJA
const API_POLA_KERJA = "/api/admin/pola-kerja";
const API_SHIFT_KERJA = "/api/admin/shift-kerja";

// === NEW: Absensi
const API_ABSENSI_RECORDS = "/api/admin/absensi/history";
const API_ABSENSI_APPROVALS = "/api/admin/absensi";

// === Kunjungan
const API_KUNJUNGAN = "/api/admin/kunjungan-klien-admin";

// === Kategori Kunjungan
const API_KATEGORI_KUNJUNGAN = "/api/admin/kategori-kunjungan";

/* === BARU: KATEGORI CUTI & KATEGORI SAKIT === */
const API_KATEGORI_CUTI = "/api/admin/kategori-cuti";
const API_KATEGORI_SAKIT = "/api/admin/kategori-sakit";

const API_CUTI_KONFIG = "/api/admin/cuti-konfigurasi";
const API_CUTI_KONFIG_MATRIX = "/api/admin/cuti-konfigurasi/matrix";

const API_KATEGORI_IZIN_JAM = "/api/admin/kategori-izin-jam";

// === Mobile: CUTI
const API_MOBILE_PENGAJUAN_CUTI = "/api/mobile/pengajuan-cuti";
const API_MOBILE_PENGAJUAN_CUTI_APPROVALS = "/api/mobile/pengajuan-cuti/approvals";

// === Mobile: IZIN JAM
const API_MOBILE_IZIN_JAM = "/api/mobile/pengajuan-izin-jam";
const API_MOBILE_IZIN_JAM_APPROVALS = "/api/mobile/pengajuan-izin-jam/approvals";

// === Mobile: SAKIT
const API_MOBILE_IZIN_SAKIT = "/api/mobile/pengajuan-izin-sakit";
const API_MOBILE_IZIN_SAKIT_APPROVALS = "/api/mobile/pengajuan-izin-sakit/approvals";

// === Mobile: TUKAR HARI
const API_MOBILE_TUKAR_HARI = "/api/mobile/pengajuan-izin-tukar-hari";
const API_MOBILE_TUKAR_HARI_APPROVALS = "/api/mobile/pengajuan-izin-tukar-hari/approvals";

// base path
const API_NOTIFICATIONS = "/api/notifications";
const API_NOTIFICATIONS_RECENT = "/api/notifications/recent";
const API_NOTIFICATIONS_MARK_ALL = "/api/notifications/mark-all-read";

// === Story Planner
const API_STORY_PLANNER = "/api/admin/story-planner";


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

  // Absensi
  GetAbsensiRecords: (qsObj = {}) => `${API_ABSENSI_RECORDS}${buildQS(qsObj)}`,
  GetAbsensiApprovals: (qsObj = {}) => `${API_ABSENSI_APPROVALS}${buildQS(qsObj)}`,
  UpdateAbsensiApproval: (id) => `${API_ABSENSI_APPROVALS}/${id}`,

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
  GetPengajuanTukarHariDetail: (id) => `${API_MOBILE_TUKAR_HARI}/${id}`,           // <— dipakai FE fallback
  UpdatePengajuanTukarHariMobile: (id) => `${API_MOBILE_TUKAR_HARI}/${id}`,
  DeletePengajuanTukarHariMobile: (id) => `${API_MOBILE_TUKAR_HARI}/${id}`,
  DecidePengajuanTukarHariMobile: (approvalId) => `${API_MOBILE_TUKAR_HARI_APPROVALS}/${approvalId}`,

  // ===== NOTIFICATIONS (user/mobile) =====
  GetNotifications: (qsObj = {}) => `${API_NOTIFICATIONS}${buildQS(qsObj)}`,
  GetNotificationsRecent: (qsObj = {}) =>
    `${API_NOTIFICATIONS_RECENT}${buildQS(qsObj)}`,
  MarkAllNotificationsRead: API_NOTIFICATIONS_MARK_ALL,
  MarkNotificationRead: (id) => `${API_NOTIFICATIONS}/${id}`,

  // ===== NOTIFICATIONS ADMIN (alias ke yang sama) =====
  GetAdminNotifications: (qsObj = {}) =>
    `${API_NOTIFICATIONS}${buildQS(qsObj)}`,
  GetAdminNotificationsRecent: (qsObj = {}) =>
    `${API_NOTIFICATIONS_RECENT}${buildQS(qsObj)}`,
  MarkAllAdminNotificationsRead: API_NOTIFICATIONS_MARK_ALL,
  MarkAdminNotificationRead: (id) => `${API_NOTIFICATIONS}/${id}`,


    // Story Planner
  GetStoryPlanner: API_STORY_PLANNER,
  CreateStoryPlanner: API_STORY_PLANNER,
  GetStoryPlannerById: (id) => `${API_STORY_PLANNER}/${id}`,
  UpdateStoryPlanner: (id) => `${API_STORY_PLANNER}/${id}`,
  DeleteStoryPlanner: (id) => `${API_STORY_PLANNER}/${id}`,


};
