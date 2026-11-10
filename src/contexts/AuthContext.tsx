import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toSessionUser, type SessionUser, type User } from "../models/User";
import type { SignupRequest, UpdateUserRequest } from "../models/UserLogin";
import { AuthService } from "../services/AuthService";
import { StorageService } from "../services/StorageService";
import { AuthClientError, authErrorMessage } from "../services/authErrors";
import { getSessionToken, setSessionToken } from "../services/sessionToken";
import { onSessionInvalidated } from "../services/api";
import { UserType } from "../models/UserType";
import { ProfilePictureService, type ProfilePictureAsset } from "../services/ProfilePictureService";
interface AuthContextType {
  user: SessionUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  isSigningOut: boolean;
  sessionError: string | null;
  handleLogin: (username: string, password: string, keepConnected: boolean) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleSignup: (data: SignupRequest) => Promise<void>;
  handleSignupAndLogin: (data: SignupRequest, picture: ProfilePictureAsset | null, onProgress: (message: string) => void) => Promise<{ pictureError: string | null }>;
  completePendingSignupLogin: () => Promise<void>;
  handleUpdateUser: (data: Omit<UpdateUserRequest, "id">) => Promise<void>;
  handleDeleteUser: () => Promise<void>;
  handleProfilePictureUpdated: (profile: User) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const isAdmin = user?.role === UserType.ADMIN;
  const persistent = useRef(false);
  const busy = useRef(false);
  const pendingSignupSession = useRef<SessionUser | null>(null);
  useEffect(() => onSessionInvalidated(() => {
    setSessionToken(null);
    persistent.current = false;
    pendingSignupSession.current = null;
    setUser(null);
  }), []);
  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const saved = await StorageService.loadSession();
        if (!active || !saved) return;
        setSessionToken(saved.token);
        const profile = await AuthService.getUser(saved.user.id);
        if (!active) return;
        if (profile.id !== saved.user.id) throw new AuthClientError("Sessão inválida. Entre novamente.");
        persistent.current = true;
        setUser(toSessionUser(profile));
      } catch (error) {
        if (!active) return;
        setSessionToken(null);
        if (axios.isAxiosError(error) && [401, 403, 404].includes(error.response?.status || 0)) {
          try { await StorageService.clearSession(); } catch {
            setSessionError("Não foi possível limpar a sessão local. Limpe os dados do aplicativo.");
            return;
          }
        }
        setSessionError(authErrorMessage(error));
      } finally { if (active) setIsRestoring(false); }
    }
    void restore();
    return () => { active = false; setSessionToken(null); };
  }, []);
  const perform = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    if (busy.current || isRestoring) throw new AuthClientError("Aguarde a operação em andamento.");
    busy.current = true;
    setIsLoading(true);
    setSessionError(null);
    try { return await action(); }
    finally { busy.current = false; setIsLoading(false); }
  }, [isRestoring]);
  const handleLogin = (username: string, password: string, keepConnected: boolean) => perform(async () => {
    setSessionToken(null);
    pendingSignupSession.current = null;
    setUser(null);
    const session = await AuthService.login(username.trim(), password);
    const profile = toSessionUser(session);
    if (keepConnected) await StorageService.saveSession(profile, session.token);
    else await StorageService.clearSession();
    persistent.current = keepConnected;
    setSessionToken(session.token);
    setUser(profile);
  });
  const handleSignup = (data: SignupRequest) => perform(async () => {
    await AuthService.signup(data);
    // Confirmed contract: signup returns a profile without any session.
    await StorageService.clearSession();
    setSessionToken(null);
    persistent.current = false;
    setUser(null);
  });
  const handleSignupAndLogin = (data: SignupRequest, picture: ProfilePictureAsset | null, onProgress: (message: string) => void) => perform(async () => {
    onProgress("Criando conta");
    await AuthService.signup(data);
    onProgress("Entrando");
    let session;
    try { session = await AuthService.login(data.username.trim(), data.password); }
    catch { throw new AuthClientError("Conta criada. Faça login para continuar"); }
    setSessionToken(session.token);
    let profile: User = session;
    let pictureError: string | null = null;
    if (picture) {
      onProgress("Enviando foto");
      try { profile = await ProfilePictureService.upload(session.id, picture); }
      catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) throw error;
        pictureError = "Conta criada, mas não foi possível enviar sua foto. Você pode tentar novamente no Perfil";
      }
    }
    const sessionUser = toSessionUser(profile);
    await StorageService.clearSession();
    persistent.current = false;
    if (pictureError) pendingSignupSession.current = sessionUser;
    else setUser(sessionUser);
    return { pictureError };
  });
  const completePendingSignupLogin = async () => {
    const pending = pendingSignupSession.current;
    if (!pending || !getSessionToken()) throw new AuthClientError("Entre novamente para continuar.");
    pendingSignupSession.current = null;
    setUser(pending);
  };
  const clearSession = async () => {
    setSessionToken(null);
    pendingSignupSession.current = null;
    setUser(null);
    persistent.current = false;
    try { await StorageService.clearSession(); }
    catch {
      const message = "Você saiu, mas não foi possível apagar os dados locais. Limpe os dados do aplicativo antes de reiniciar.";
      setSessionError(message);
      throw new AuthClientError(message);
    }
  };
  const handleLogout = () => perform(async () => {
    setIsSigningOut(true);
    try { await clearSession(); } finally { setIsSigningOut(false); }
  });
  const handleUpdateUser = (data: Omit<UpdateUserRequest, "id">) => perform(async () => {
    const token = getSessionToken();
    if (!user || !token) throw new AuthClientError("Entre novamente para atualizar o perfil.");
    const updated = toSessionUser(await AuthService.updateUser({ ...data, id: user.id }));
    if (persistent.current) await StorageService.saveSession(updated, token);
    setUser(updated);
  });
  const handleDeleteUser = () => perform(async () => {
    if (!user || !getSessionToken()) throw new AuthClientError("Entre novamente para excluir a conta.");
    await AuthService.deleteUser(user.id);
    await clearSession();
  });
  const handleProfilePictureUpdated = async (profile: User) => {
    const token = getSessionToken();
    if (!user || !token || profile.id !== user.id) throw new AuthClientError("Entre novamente para atualizar a foto.");
    const updated = toSessionUser(profile);
    if (persistent.current) await StorageService.saveSession(updated, token);
    setUser(updated);
  };
  return <AuthContext.Provider value={{ user, isAdmin, isLoading, isRestoring, isSigningOut, sessionError,
    handleLogin, handleLogout, handleSignup, handleSignupAndLogin, completePendingSignupLogin, handleUpdateUser, handleDeleteUser, handleProfilePictureUpdated }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};
