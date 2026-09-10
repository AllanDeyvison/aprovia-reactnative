import { authApi } from "./api";
import { AuthClientError } from "./authErrors";
import { normalizeToken } from "./sessionToken";
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse, UpdateUserRequest } from "../models/UserLogin";
import { isSessionUser, type User } from "../models/User";
function publicProfile(value: unknown): User {
  if (!isSessionUser(value)) throw new AuthClientError("Resposta de usuário inválida recebida do servidor.");
  const data = value as unknown as Record<string, unknown>;
  if (typeof data.lastname !== "string" || typeof data.email !== "string" || typeof data.birthday !== "string")
    throw new AuthClientError("Resposta de usuário inválida recebida do servidor.");
  return { id: value.id, username: value.username, name: value.name, picture: value.picture,
    lastname: data.lastname, email: data.email, birthday: data.birthday };
}
export const AuthService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const request: LoginRequest = { username, password };
    const response = await authApi.post<unknown>("/user/login", request);
    const user = publicProfile(response.data);
    let token: string;
    try { token = normalizeToken((response.data as Record<string, unknown>).token); }
    catch { throw new AuthClientError("O servidor não retornou uma sessão válida."); }
    return { ...user, token };
  },
  async signup(request: SignupRequest): Promise<SignupResponse> {
    const response = await authApi.post<unknown>("/user/signup", request);
    return publicProfile(response.data);
  },
  async updateUser(request: UpdateUserRequest): Promise<User> {
    return publicProfile((await authApi.put<unknown>("/user/update", request)).data);
  },
  async deleteUser(userId: number): Promise<void> { await authApi.delete(`/user/${userId}`); },
  async getUser(userId: number): Promise<User> {
    return publicProfile((await authApi.get<unknown>(`/user/${userId}`)).data);
  },
};
// Axios errors propagate unchanged, preserving status/code/response for typed handling.
