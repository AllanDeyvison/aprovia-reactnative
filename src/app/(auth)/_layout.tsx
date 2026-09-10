import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/Loading";

export default function AuthLayout() {
  const { user, isRestoring } = useAuth();
  if (isRestoring) return <Loading message="Restaurando sessão..." fullScreen />;
  if (user) return <Redirect href="/home" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
