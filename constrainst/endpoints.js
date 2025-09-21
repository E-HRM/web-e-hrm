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

const API_POLA_KERJA = "/api/admin/pola-kerja";

const API_SHIFT_KERJA = "/api/admin/shift-kerja";

0
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
  CreateUser: API_REGISTER, // penting: create pakai REGISTER
  GetUserById: (id) => `${API_USERS}/${id}`,
  UpdateUser: (id) => `${API_USERS}/${id}`,
  DeleteUser: (id) => `${API_USERS}/${id}`,

  // === NEW: Agenda (master aktivitas)
  GetAgenda: API_AGENDA,                 // GET list (q,page,perPage)
  CreateAgenda: API_AGENDA,              // POST { nama_agenda }
  GetAgendaById: (id) => `${API_AGENDA}/${id}`,     // GET detail
  UpdateAgenda: (id) => `${API_AGENDA}/${id}`,      // PATCH { nama_agenda }
  DeleteAgenda: (id) => `${API_AGENDA}/${id}`,      // DELETE ?hard=0|1

  // === NEW: Agenda Kerja (jadwal kerja)
  GetAgendaKerja: API_AGENDA_KERJA,                 // GET list (filter user_id,id_agenda,status,date|from|to,page,perPage)
  CreateAgendaKerja: API_AGENDA_KERJA,              // POST {...}
  GetAgendaKerjaById: (id) => `${API_AGENDA_KERJA}/${id}`, // GET detail
  UpdateAgendaKerja: (id) => `${API_AGENDA_KERJA}/${id}`,  // PUT
  DeleteAgendaKerja: (id) => `${API_AGENDA_KERJA}/${id}`,  // DELETE ?hard=0|1

  // POLA KERJA
  GetPolaKerja: API_POLA_KERJA,                          // GET ?page=&pageSize=&search=
  CreatePolaKerja: API_POLA_KERJA,                       // POST
  GetPolaKerjaById: (id) => `${API_POLA_KERJA}/${id}`,   // GET detail
  UpdatePolaKerja: (id) => `${API_POLA_KERJA}/${id}`,    // PUT/PATCH
  DeletePolaKerja: (id) => `${API_POLA_KERJA}/${id}`,    // DELETE


  GetShiftKerja: API_SHIFT_KERJA,
  CreateShiftKerja: API_SHIFT_KERJA,
  GetShiftKerjaById: (id) => `${API_SHIFT_KERJA}/${id}`,
  UpdateShiftKerja: (id) => `${API_SHIFT_KERJA}/${id}`,
  DeleteShiftKerja: (id) => `${API_SHIFT_KERJA}/${id}`,
};

