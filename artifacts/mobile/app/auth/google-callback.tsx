import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { auth } from "@/lib/firebase";

/**
 * Deep-link landing screen for the Google OAuth callback.
 *
 * When the Android intent:// URL opens Expo Go, Expo Router navigates here
 * with ?id_token=<token> in the search params. We sign in to Firebase
 * directly from this screen. The AuthGate in _layout.tsx then detects the
 * authenticated user and navigates to /(tabs)/home.
 *
 * maybeCompleteAuthSession() is also called to close any lingering
 * in-app browser session on web.
 */
WebBrowser.maybeCompleteAuthSession();

export default function GoogleCallbackScreen() {
  const { id_token } = useLocalSearchParams<{ id_token?: string }>();

  useEffect(() => {
    if (!id_token) return;
    const credential = GoogleAuthProvider.credential(id_token);
    signInWithCredential(auth, credential).catch((err: unknown) => {
      console.error("Firebase sign-in from callback failed:", err);
    });
  }, [id_token]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
