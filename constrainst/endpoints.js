const API_DEPARTEMENT = "/api/admin/departements";
const API_LOCATION = "/api/admin/location";
const API_USERS = "/api/admin/users";

// Auth (reset password)
const API_RESET_PASSWORD_REQUEST = "/api/mobile/auth/reset-password/request-token";
const API_RESET_PASSWORD_CONFIRM = "/api/mobile/auth/reset-password";

// Register (CREATE user lewat endpoint ini!)
const API_REGISTER = "/api/mobile/auth/register";

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
  // IMPORTANT: Create user pakai REGISTER (bukan /api/users)
  CreateUser: API_REGISTER,
  GetLocation: "/api/admin/location",
  GetUserById: (id) => `${API_USERS}/${id}`,
  UpdateUser: (id) => `${API_USERS}/${id}`,
  DeleteUser: (id) => `${API_USERS}/${id}`,
};
