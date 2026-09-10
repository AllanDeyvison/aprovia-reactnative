import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/Loading";
import { AppShell } from "@/components/navigation/AppShell";

export default function AppLayout() {
  const { user, isRestoring } = useAuth();
  if (isRestoring) return <Loading message="Restaurando sessão..." fullScreen />;
  if (!user) return <Redirect href="/login" />;
  return <AppShell />;
}
