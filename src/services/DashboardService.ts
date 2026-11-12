import { chatApi } from "./api";
import { parsePersonalDashboard, type PersonalDashboard } from "../models/Dashboard";
const listeners = new Set<() => void>();
export const DashboardService = { async get(): Promise<PersonalDashboard> { const response = await chatApi.get<unknown>("/dashboard/me"); return parsePersonalDashboard(response.data); }, subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }, invalidate() { listeners.forEach((listener) => listener()); } };
