import { signInWithCustomToken } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

/**
 * Landing screen for the Google OAuth callback, reached two different ways:
 *
 * - Native: when the Android intent:// URL opens Expo Go, Expo Router
 *   navigates here with ?custom_token=<token>. We sign in to Firebase
 *   directly from this screen and navigate to /(tabs)/home ourselves —
 *   there's no global auth-gate redirect elsewhere in the app, so nothing
 *   else will do it (see the matching comment in AuthContext.tsx).
 * - Web: this page is loaded inside the popup window opened by
 *   AuthContext's signInWithGoogleWeb. Instead of signing in itself, it
 *   relays the token back to the opener window via postMessage and closes
 *   itself — the opener is what actually calls signInWithCustomToken.
 *
 * maybeCompleteAuthSession() is also called to close any lingering
 * in-app browser session on web.
 */
WebBrowser.maybeCompleteAuthSession();

export default function GoogleCallbackScreen() {
  const { custom_token, error } = useLocalSearchParams<{ custom_token?: string; error?: string }>();
  const { setError } = useAuth();

  useEffect(() => {
    if (Platform.OS === "web") {
      if (window.opener) {
        window.opener.postMessage(
          { type: "google-auth", customToken: custom_token, error },
          window.location.origin,
        );
      }
      window.close();
      return;
    }

    if (error) {
      setError(String(error));
      router.replace("/");
      return;
    }

    if (!custom_token) return;
    signInWithCustomToken(auth, custom_token)
      .then(() => {
        router.replace("/(tabs)/home");
      })
      .catch((err: unknown) => {
        console.error("Firebase sign-in from callback failed:", err);
        setError(err instanceof Error ? err.message : "Sign-in failed — please try again.");
        router.replace("/");
      });
  }, [custom_token, error, setError]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
