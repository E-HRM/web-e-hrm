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
const API_AGENDA = "/api/mobile/agenda";
const API_AGENDA_KERJA = "/api/mobile/agenda-kerja";

// POLA & SHIFT KERJA
const API_POLA_KERJA = "/api/admin/pola-kerja";
const API_SHIFT_KERJA = "/api/admin/shift-kerja";

// === NEW: Absensi (records harian) & Approvals (persetujuan kehadiran)
const API_ABSENSI_RECORDS = "/api/admin/absensi/history";      // GET ?date=YYYY-MM-DD&type=in|out&divisi=&status=&q=
const API_ABSENSI_APPROVALS = "/api/admin/absensi/";   // GET list, PATCH /[id]

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

  // === Absensi (baru)
  // List catatan absensi (kedatangan/kepulangan) siap tampil
  GetAbsensiRecords: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    return `${API_ABSENSI_RECORDS}?${qs.toString()}`;
  },

  // Approvals / persetujuan kehadiran
  GetAbsensiApprovals: (qsObj = {}) => {
    const qs = new URLSearchParams(qsObj);
    return `${API_ABSENSI_APPROVALS}?${qs.toString()}`;
  },
  UpdateAbsensiApproval: (id) => `${API_ABSENSI_APPROVALS}/${id}`,
};
