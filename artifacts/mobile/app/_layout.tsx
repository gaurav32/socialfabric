import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// Point the API client at the shared reverse-proxy domain.
// EXPO_PUBLIC_API_URL is set at env level (unlike EXPO_PUBLIC_DOMAIN).
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

function AuthTokenSetup({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (user) {
        return await user.getIdToken();
      }
      return null;
    });
  }, [user]);

  return <>{children}</>;
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/email" />
      <Stack.Screen name="auth/google-callback" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // On web there is no native splash screen — render immediately.
  // On native, wait for fonts (or 2s safety timeout).
  const [ready, setReady] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web") {
      SplashScreen.hideAsync();
      return;
    }
    if (fontsLoaded || fontError) {
      setReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Native safety net: never block for more than 2 seconds.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const t = setTimeout(() => {
      setReady(true);
      SplashScreen.hideAsync();
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <AuthTokenSetup>
                  <RootLayoutNav />
                </AuthTokenSetup>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
