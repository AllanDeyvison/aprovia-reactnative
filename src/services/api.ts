import axios from "axios";
import { getSessionToken } from "./sessionToken";
import { AuthClientError } from "./authErrors";
const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API?.trim().replace(/\/+$/, "");
const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_API;
export const authApi = axios.create({ baseURL: AUTH_API_URL, timeout: 15000 });
export const chatApi = axios.create({ baseURL: CHAT_API_URL, timeout: 60000 });
authApi.interceptors.request.use(config => {
  // Fail at request time so missing configuration can be displayed in the form.
  try {
    const url = new URL(AUTH_API_URL || "");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
  } catch {
    throw new AuthClientError("Configure EXPO_PUBLIC_AUTH_API com o endereço HTTP(S) do backend e reinicie o Expo.");
  }
  const publicRoute = config.url === "/user/login" || config.url === "/user/signup";
  const token = getSessionToken();
  config.headers.delete("Authorization");
  if (!publicRoute && token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});
export { AUTH_API_URL, CHAT_API_URL };
