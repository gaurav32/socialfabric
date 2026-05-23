import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack, useRootNavigationState, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// Point the API client at the shared reverse-proxy domain in Expo (native/web).
// EXPO_PUBLIC_API_URL is set in the environment (unlike EXPO_PUBLIC_DOMAIN).
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Global auth gate — mounted inside AuthProvider so it always runs,
 * regardless of the current screen. When user becomes non-null (auth
 * succeeds from any path — popup, deep link, or cold start), we
 * immediately navigate to the home tab.
 */
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (typeof user?.getIdToken === "function") {
      setAuthTokenGetter(() => (user as { getIdToken: () => Promise<string> }).getIdToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [user]);

  useEffect(() => {
    // Wait until the navigator has actually mounted before trying to navigate.
    if (!navState?.key) return;
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (user && !inAuthGroup) {
      // Authenticated but not on home yet — go there now
      router.replace("/(tabs)/home");
    } else if (!user && inAuthGroup) {
      // Logged out while inside tabs — back to login
      router.replace("/");
    }
  }, [user, loading, segments, navState?.key]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/email" />
        <Stack.Screen name="auth/google-callback" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hiddenRef = useRef(false);

  const hideSplash = () => {
    if (!hiddenRef.current) {
      hiddenRef.current = true;
      SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    if (fontsLoaded || fontError) hideSplash();
  }, [fontsLoaded, fontError]);

  // Safety net: never block the UI for more than 2s waiting for fonts.
  useEffect(() => {
    const t = setTimeout(hideSplash, 2000);
    return () => clearTimeout(t);
  }, []);

  // On web, system fonts are fine — don't hold up the render at all.
  if (Platform.OS !== "web" && !fontsLoaded && !fontError && !hiddenRef.current) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <RootLayoutNav />
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
