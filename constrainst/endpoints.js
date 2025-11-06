// Location
const API_LOCATION = "/api/admin/location";
// Departement
const API_DEPARTEMENT = "/api/admin/departements";
// Users & Auth
const API_USERS = "/api/admin/users";
const API_RESET_PASSWORD_REQUEST = "/api/mobile/auth/reset-password/request-token";
const API_RESET_PASSWORD_CONFIRM = "/api/mobile/auth/reset-password";
const API_REGISTER = "/api/mobile/auth/register";

// NEW: Agenda (master aktivitas) & Agenda Kerja (jadwal kerja yang refer ke agenda)
const API_AGENDA = "/api/admin/agenda";
const API_AGENDA_KERJA = "/api/admin/agenda-kerja-admin";
const API_AGENDA_KERJA_IMPORT = "/api/admin/agenda-kerja-admin/import";
const API_AGENDA_KERJA_IMPORT_TEMPLATE = "/api/admin/agenda-kerja-admin/import/template";

// === NEW: Jabatan
const API_JABATAN = "/api/admin/jabatans";

// POLA & SHIFT KERJA
const API_POLA_KERJA = "/api/admin/pola-kerja";
const API_SHIFT_KERJA = "/api/admin/shift-kerja";

// === NEW: Absensi (records harian) & Approvals (persetujuan kehadiran)
const API_ABSENSI_RECORDS = "/api/admin/absensi/history";
const API_ABSENSI_APPROVALS = "/api/admin/absensi";       

// === Kunjungan
const API_KUNJUNGAN = "/api/admin/kunjungan-klien-admin";

// === Kategori Kunjungan (BARU)
const API_KATEGORI_KUNJUNGAN = "/api/admin/kategori-kunjungan";

/* === BARU: KATEGORI CUTI & KATEGORI SAKIT === */
const API_KATEGORI_CUTI = "/api/admin/kategori-cuti";
const API_KATEGORI_SAKIT = "/api/admin/kategori-sakit";

const API_CUTI_KONFIG = "/api/admin/cuti-konfigurasi";
const API_CUTI_KONFIG_MATRIX = "/api/admin/cuti-konfigurasi/matrix";

const API_KATEGORI_IZIN_JAM = "/api/admin/kategori-izin-jam";

const API_MOBILE_PENGAJUAN_CUTI = "/api/mobile/pengajuan-cuti";
const API_MOBILE_PENGAJUAN_CUTI_APPROVALS = "/api/mobile/pengajuan-cuti/approvals";

const API_MOBILE_IZIN_JAM = "/api/mobile/pengajuan-izin-jam";
const API_MOBILE_IZIN_JAM_APPROVALS = "/api/mobile/pengajuan-izin-jam/approvals";

// ==== SAKIT ====
const API_MOBILE_IZIN_SAKIT = "/api/mobile/pengajuan-izin-sakit";
const API_MOBILE_IZIN_SAKIT_APPROVALS = "/api/mobile/pengajuan-izin-sakit/approvals";

// ==== TUKAR HARI ====
const API_MOBILE_TUKAR_HARI = "/api/mobile/pengajuan-izin-tukar-hari";
const API_MOBILE_TUKAR_HARI_APPROVALS = "/api/mobile/pengajuan-izin-tukar-hari/approvals";

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
  GetAbsensiRecords: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    const s = qs.toString();
    return s ? `${API_ABSENSI_RECORDS}?${s}` : API_ABSENSI_RECORDS;
  },
  GetAbsensiApprovals: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    const s = qs.toString();
    return s ? `${API_ABSENSI_APPROVALS}?${s}` : API_ABSENSI_APPROVALS;
  },
  UpdateAbsensiApproval: (id) => `${API_ABSENSI_APPROVALS}/${id}`,

  // Kunjungan
  GetKunjungan: API_KUNJUNGAN,
  CreateKunjungan: API_KUNJUNGAN,
  GetKunjunganById: (id) => `${API_KUNJUNGAN}/${id}`,
  UpdateKunjungan: (id) => `${API_KUNJUNGAN}/${id}`,
  DeleteKunjungan: (id) => `${API_KUNJUNGAN}/${id}`,

  // Kategori Kunjungan (BARU)
  GetKategoriKunjungan: API_KATEGORI_KUNJUNGAN,
  CreateKategoriKunjungan: API_KATEGORI_KUNJUNGAN,
  GetKategoriKunjunganById: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}`,
  UpdateKategoriKunjungan: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}`,
  DeleteKategoriKunjungan: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}`,
  RestoreKategoriKunjungan: (id) => `${API_KATEGORI_KUNJUNGAN}/${id}/restore`,

    /* === BARU: Kategori Cuti & Sakit === */
  GetKategoriCuti: API_KATEGORI_CUTI,
  CreateKategoriCuti: API_KATEGORI_CUTI,
  GetKategoriCutiById: (id) => `${API_KATEGORI_CUTI}/${id}`,
  UpdateKategoriCuti: (id) => `${API_KATEGORI_CUTI}/${id}`,
  DeleteKategoriCuti: (id) => `${API_KATEGORI_CUTI}/${id}`,

  GetKategoriSakit: API_KATEGORI_SAKIT,
  CreateKategoriSakit: API_KATEGORI_SAKIT,
  GetKategoriSakitById: (id) => `${API_KATEGORI_SAKIT}/${id}`,
  UpdateKategoriSakit: (id) => `${API_KATEGORI_SAKIT}/${id}`,
  DeleteKategoriSakit: (id) => `${API_KATEGORI_SAKIT}/${id}`,

  GetCutiKonfigurasi: API_CUTI_KONFIG,
  CreateCutiKonfigurasi: API_CUTI_KONFIG,
  GetCutiKonfigurasiById: (id) => `${API_CUTI_KONFIG}/${id}`,
  UpdateCutiKonfigurasi: (id) => `${API_CUTI_KONFIG}/${id}`,
  DeleteCutiKonfigurasi: (id) => `${API_CUTI_KONFIG}/${id}`,

    GetCutiKonfigurasiMatrix: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    const s = qs.toString();
    return s ? `${API_CUTI_KONFIG_MATRIX}?${s}` : API_CUTI_KONFIG_MATRIX;
  },
  SaveCutiKonfigurasiMatrix: API_CUTI_KONFIG_MATRIX,

  // (opsional) Master kategori izin jam:
  GetKategoriIzinJam: API_KATEGORI_IZIN_JAM,
  GetKategoriIzinJamById: (id) => `${API_KATEGORI_IZIN_JAM}/${id}`,
  CreateKategoriIzinJam: API_KATEGORI_IZIN_JAM,
  UpdateKategoriIzinJam: (id) => `${API_KATEGORI_IZIN_JAM}/${id}`,
  DeleteKategoriIzinJam: (id) => `${API_KATEGORI_IZIN_JAM}/${id}`,
  
  // PENGAJUAN CUTI
    GetPengajuanCutiMobile: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    const s = qs.toString();
    return s ? `${API_MOBILE_PENGAJUAN_CUTI}?${s}` : API_MOBILE_PENGAJUAN_CUTI;
  },
  CreatePengajuanCutiMobile: API_MOBILE_PENGAJUAN_CUTI,
  GetPengajuanCutiMobileById: (id) => `${API_MOBILE_PENGAJUAN_CUTI}/${id}`,
  UpdatePengajuanCutiMobile: (id) => `${API_MOBILE_PENGAJUAN_CUTI}/${id}`,
  DeletePengajuanCutiMobile: (id) => `${API_MOBILE_PENGAJUAN_CUTI}/${id}`,

  // Keputusan approval (butuh id_approval_pengajuan_cuti)
  DecidePengajuanCutiMobile: (approvalId) =>
    `${API_MOBILE_PENGAJUAN_CUTI_APPROVALS}/${approvalId}`,

    GetPengajuanIzinJamMobile: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    const s = qs.toString();
    return s ? `${API_MOBILE_IZIN_JAM}?${s}` : API_MOBILE_IZIN_JAM;
  },
  
  CreatePengajuanIzinJamMobile: API_MOBILE_IZIN_JAM,
  GetPengajuanIzinJamMobileById: (id) => `${API_MOBILE_IZIN_JAM}/${id}`,
  UpdatePengajuanIzinJamMobile: (id) => `${API_MOBILE_IZIN_JAM}/${id}`,
  DeletePengajuanIzinJamMobile: (id) => `${API_MOBILE_IZIN_JAM}/${id}`,

  DecidePengajuanIzinJamMobile: (approvalId) =>
    `${API_MOBILE_IZIN_JAM_APPROVALS}/${approvalId}`,

    GetPengajuanIzinSakitMobile: (qsObj = {}) => {
    const p = new URLSearchParams();
    Object.entries(qsObj).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      const s = String(v).trim();
      if (s !== "") p.set(k, s);
    });
    const qs = p.toString();
    return qs ? `${API_MOBILE_IZIN_SAKIT}?${qs}` : API_MOBILE_IZIN_SAKIT;
  },
  // Approve/Reject Sakit
  DecidePengajuanIzinSakitMobile: (approvalId) =>
    `${API_MOBILE_IZIN_SAKIT_APPROVALS}/${approvalId}`,

  // LIST Tukar Hari
  GetPengajuanTukarHariMobile: (qsObj = {}) => {
    const p = new URLSearchParams();
    Object.entries(qsObj).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      const s = String(v).trim();
      if (s !== "") p.set(k, s);
    });
    const qs = p.toString();
    return qs ? `${API_MOBILE_TUKAR_HARI}?${qs}` : API_MOBILE_TUKAR_HARI;
  },
  // Approve/Reject Tukar Hari
  DecidePengajuanTukarHariMobile: (approvalId) =>
    `${API_MOBILE_TUKAR_HARI_APPROVALS}/${approvalId}`,
};
