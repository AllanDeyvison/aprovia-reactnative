import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PushNotificationService } from "@/services/PushNotificationService";
import { useAuth } from "./AuthContext";

export type LocalNotice = { id: string; title: string; body: string; type?: string; data: Record<string, unknown>; receivedAt: string; read: boolean };
type Value = { notices: LocalNotice[]; unread: number; enable: () => Promise<string | null>; markAllRead: () => void; open: (notice: LocalNotice) => void };
const Context = createContext<Value | undefined>(undefined);
const MAX = 50;
const key = (id: string) => `aprovia:notifications:${id}`;

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth(); const router = useRouter(); const [notices, setNotices] = useState<LocalNotice[]>([]); const token = useRef<string | null>(null); const seen = useRef(new Set<string>());
  useEffect(() => { let mounted = true; seen.current.clear(); setNotices([]); if (!user?.id) return; AsyncStorage.getItem(key(user.id)).then(raw => { if (mounted && raw) setNotices(JSON.parse(raw)); }).catch(() => {}); return () => { mounted = false; }; }, [user?.id]);
  useEffect(() => { if (!user?.id) { void PushNotificationService.unregister(token.current); token.current = null; return; } return PushNotificationService.subscribe((notification: any) => capture(notification), (notification: any) => { capture(notification); openNotice(toNotice(notification)); }); }, [user?.id]);
  const persist = useCallback((next: LocalNotice[]) => { setNotices(next); if (user?.id) void AsyncStorage.setItem(key(user.id), JSON.stringify(next)).catch(() => {}); }, [user?.id]);
  const toNotice = (notification: any): LocalNotice => ({ id: notification.request.identifier, title: notification.request.content.title || "AprovIA", body: notification.request.content.body || "", type: notification.request.content.data?.type, data: notification.request.content.data || {}, receivedAt: new Date().toISOString(), read: false });
  const capture = (notification: any) => { if (!user?.id) return; const item = toNotice(notification); if (seen.current.has(item.id)) return; seen.current.add(item.id); setNotices(current => { const next = [item, ...current.filter(value => value.id !== item.id)].slice(0, MAX); void AsyncStorage.setItem(key(user.id), JSON.stringify(next)).catch(() => {}); return next; }); };
  const openNotice = (notice: LocalNotice) => { if (notice.type === "exam_published" && typeof notice.data.examId === "string") router.push({ pathname: "/exams", params: { examId: notice.data.examId } } as any); else if (notice.type === "material_created" && typeof notice.data.conteudo === "string") router.push({ pathname: "/materials", params: { folder: notice.data.conteudo } } as any); else if (notice.type === "daily_reminder") router.push("/chat" as any); };
  const enable = useCallback(async () => { const result = await PushNotificationService.requestAndRegister(); if (result.ok) token.current = result.token ?? null; return result.ok ? null : result.reason ?? "Não foi possível ativar notificações."; }, []);
  const markAllRead = () => persist(notices.map(value => ({ ...value, read: true })));
  const value = useMemo(() => ({ notices, unread: notices.filter(value => !value.read).length, enable, markAllRead, open: openNotice }), [notices, enable]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const usePushNotifications = () => { const value = useContext(Context); if (!value) throw new Error("PushNotificationsProvider ausente"); return value; };
