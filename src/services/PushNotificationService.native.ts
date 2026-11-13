import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { chatApi } from "./api";

const CHANNEL_ID = process.env.EXPO_PUBLIC_ANDROID_NOTIFICATION_CHANNEL?.trim() || "aprovia-notifications";
const timeout = <T,>(promise: Promise<T>, ms = 4000) => Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Tempo esgotado")), ms))]);

async function token() {
  if (!Device.isDevice) throw new Error("Notificações push exigem um dispositivo físico.");
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: "AprovIA", importance: Notifications.AndroidImportance.HIGH });
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") throw new Error("Permissão de notificações não concedida.");
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("Project ID do EAS não configurado.");
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export const PushNotificationService = {
  isSupported: true,
  async requestAndRegister() {
    try { const value = await token(); await chatApi.post("/notifications/tokens", { token: value, platform: Platform.OS }); return { ok: true, token: value }; }
    catch (error) { return { ok: false, reason: error instanceof Error ? error.message : "Não foi possível registrar notificações." }; }
  },
  async unregister(pushToken: string | null) { if (pushToken) try { await timeout(chatApi.delete("/notifications/tokens", { data: { token: pushToken } })); } catch {} },
  subscribe(onReceive: (notification: Notifications.Notification) => void, onResponse: (notification: Notifications.Notification) => void) {
    const received = Notifications.addNotificationReceivedListener(onReceive);
    const response = Notifications.addNotificationResponseReceivedListener(({ notification }) => onResponse(notification));
    Notifications.getLastNotificationResponseAsync().then((last) => last?.notification && onResponse(last.notification));
    const rolled = Notifications.addPushTokenListener(({ data }) => { void chatApi.post("/notifications/tokens", { token: data, platform: Platform.OS }); });
    return () => { received.remove(); response.remove(); rolled.remove(); };
  },
};
