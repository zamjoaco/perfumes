// Espejo de los records del paquete auth/ del backend.
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresAt: string; // ISO 8601
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
