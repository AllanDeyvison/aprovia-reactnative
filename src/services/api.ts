import axios from "axios";
import { getSessionToken } from "./sessionToken";
import { AuthClientError } from "./authErrors";
import { StorageService } from "./StorageService";
const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API?.trim().replace(/\/+$/, "");
// The Python API is configured once for every Expo target (web, Android and iOS).
const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
export const authApi = axios.create({ baseURL: AUTH_API_URL, timeout: 15000 });
export const chatApi = axios.create({ baseURL: API_URL, timeout: 60000 });

type SessionInvalidationListener = () => void;
const sessionInvalidationListeners = new Set<SessionInvalidationListener>();

export function onSessionInvalidated(listener: SessionInvalidationListener) {
  sessionInvalidationListeners.add(listener);
  return () => { sessionInvalidationListeners.delete(listener); };
}

export async function invalidateSession(): Promise<void> {
  // Notify first so route guards move to login even if persistent storage is unavailable.
  for (const listener of sessionInvalidationListeners) listener();
  try { await StorageService.clearSession(); } catch { /* session is still invalid in memory */ }
}

function requireAccessToken(): string {
  const token = getSessionToken();
  if (token) return token;
  void invalidateSession();
  throw new AuthClientError("Sua sessão expirou. Entre novamente.");
}

export function getAuthenticatedHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${requireAccessToken()}`,
    "Content-Type": "application/json",
  };
}
authApi.interceptors.request.use(config => {
  // Fail at request time so missing configuration can be displayed in the form.
  try {
    const url = new URL(AUTH_API_URL || "");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
  } catch {
    throw new AuthClientError("Configure EXPO_PUBLIC_AUTH_API com o endereço HTTP(S) do backend e reinicie o Expo.");
  }
  const publicRoute = config.url === "/user/login" || config.url === "/user/signup";
  config.headers.delete("Authorization");
  if (!publicRoute) config.headers.set("Authorization", `Bearer ${requireAccessToken()}`);
  config.headers.set("Content-Type", "application/json");
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) void invalidateSession();
    return Promise.reject(error);
  },
);

chatApi.interceptors.request.use((config) => {
  if (!API_URL) throw new AuthClientError("Configure EXPO_PUBLIC_API_URL com o endereço da API Python e reinicie o Expo.");
  config.headers.set("Authorization", `Bearer ${requireAccessToken()}`);
  config.headers.set("Content-Type", "application/json");
  return config;
});

chatApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) void invalidateSession();
    return Promise.reject(error);
  },
);

export { AUTH_API_URL, API_URL };
