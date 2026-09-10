import type { User } from "./User";
export interface LoginRequest { username: string; password: string }
export interface SignupRequest {
  username: string;
  password: string;
  name: string;
  lastname: string;
  email: string;
  birthday: string;
  picture?: string;
}
// The backend requires a complete User, including password, for PUT /user/update.
export interface UpdateUserRequest extends SignupRequest { id: number }
export interface LoginResponse extends User { token: string }
export type SignupResponse = User; // No session/token returned by this backend.
