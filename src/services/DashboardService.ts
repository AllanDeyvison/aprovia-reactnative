import { chatApi } from "./api";
import type { PersonalDashboard } from "../models/Dashboard";
const listeners = new Set<() => void>();
export const DashboardService = { get: async (): Promise<PersonalDashboard> => (await chatApi.get<PersonalDashboard>("/dashboard/me")).data, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }, invalidate() { listeners.forEach((listener) => listener()); } };
