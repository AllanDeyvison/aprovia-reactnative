import { Stack } from "expo-router";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ModelProvider } from "@/contexts/ModelContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfilePictureProvider } from "@/contexts/ProfilePictureContext";
import { PushNotificationsProvider } from "@/contexts/PushNotificationsContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <AuthProvider>
            <PushNotificationsProvider>
            <ProfilePictureProvider>
            <ModelProvider>
              <ChatProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                </Stack>
              </ChatProvider>
            </ModelProvider>
            </ProfilePictureProvider>
            </PushNotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
