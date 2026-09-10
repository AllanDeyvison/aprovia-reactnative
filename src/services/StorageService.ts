import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { isSessionUser, toSessionUser, type SessionUser } from "../models/User";
import { normalizeToken } from "./sessionToken";
const USER_KEY = "aprovia.session.user.v1";
const TOKEN_KEY = "aprovia.session.token.v1"; // Valid SecureStore key (no @).
const LEGACY_KEYS = ["@aprovia_user", "@aprovia_token"];
const MODEL_STORAGE_KEY = "@aprovia_model";
const native = Platform.OS === "android" || Platform.OS === "ios";
const tokenStore = {
  get: () => native ? SecureStore.getItemAsync(TOKEN_KEY) : AsyncStorage.getItem(TOKEN_KEY),
  set: (v: string) => native ? SecureStore.setItemAsync(TOKEN_KEY, v) : AsyncStorage.setItem(TOKEN_KEY, v),
  remove: () => native ? SecureStore.deleteItemAsync(TOKEN_KEY) : AsyncStorage.removeItem(TOKEN_KEY),
};
export const StorageService = {
  async clearSession(): Promise<void> {
    const results = await Promise.allSettled([
      AsyncStorage.multiRemove([USER_KEY, TOKEN_KEY, ...LEGACY_KEYS]), tokenStore.remove(),
    ]);
    if (results.some(r => r.status === "rejected")) throw new Error("Session cleanup failed");
  },
  async saveSession(user: SessionUser, token: string): Promise<void> {
    await this.clearSession();
    try {
      await tokenStore.set(normalizeToken(token));
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(toSessionUser(user)));
    } catch (error) { await this.clearSession(); throw error; }
  },
  async loadSession(): Promise<{ user: SessionUser; token: string } | null> {
    // Discard legacy profiles that could contain password/token.
    await AsyncStorage.multiRemove(LEGACY_KEYS);
    const [rawUser, rawToken] = await Promise.all([AsyncStorage.getItem(USER_KEY), tokenStore.get()]);
    if (!rawUser || !rawToken) { await this.clearSession(); return null; }
    try {
      const user: unknown = JSON.parse(rawUser);
      if (!isSessionUser(user)) throw new Error("Invalid profile");
      const token = normalizeToken(rawToken);
      const publicUser = toSessionUser(user);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(publicUser));
      return { user: publicUser, token };
    } catch { await this.clearSession(); return null; }
  },
  async saveModel(model: string): Promise<void> { await AsyncStorage.setItem(MODEL_STORAGE_KEY, model); },
  async getModel(): Promise<string> {
    return (await AsyncStorage.getItem(MODEL_STORAGE_KEY)) || "llama3";
  },
  async clearAll(): Promise<void> {
    await this.clearSession();
    await AsyncStorage.removeItem("@aprovia_chats");
  },
};
