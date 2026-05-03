import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const API_ORIGIN =
  process.env["EXPO_PUBLIC_API_URL"] ??
  "https://a5fcae06-0b34-4951-9dfd-cef9d6f6c0c3-00-l4iig0njt0xp.pike.replit.dev";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  promptGoogleSignIn: () => Promise<void>;
  signInWithPhone: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  promptGoogleSignIn: async () => {},
  signInWithPhone: async () => {},
  logout: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        await AsyncStorage.setItem("user_uid", firebaseUser.uid);
      } else {
        await AsyncStorage.removeItem("user_uid");
      }
    });
    return unsubscribe;
  }, []);

  /** Web: Firebase signInWithPopup (works natively in browsers) */
  const signInWithGoogleWeb = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    await signInWithPopup(auth, provider);
  };

  /** Native (Android/iOS): server-side OAuth proxy via openAuthSessionAsync */
  const signInWithGoogleNative = async () => {
    const appRedirectUri = Linking.createURL("auth/google-callback");
    const startUrl =
      `${API_ORIGIN}/api/auth/google/start` +
      `?app_redirect_uri=${encodeURIComponent(appRedirectUri)}`;

    const result = await WebBrowser.openAuthSessionAsync(startUrl, appRedirectUri);

    if (result.type === "cancel" || result.type === "dismiss") {
      setError("Sign-in was cancelled.");
      return;
    }

    if (result.type === "success") {
      const parsed = Linking.parse(result.url);
      const idToken = parsed.queryParams?.["id_token"];
      const oauthError = parsed.queryParams?.["error"];

      if (oauthError) {
        setError(String(oauthError));
        return;
      }
      if (idToken && typeof idToken === "string") {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else {
        setError("No token received — please try again.");
      }
    }
  };

  const promptGoogleSignIn = async () => {
    setError(null);
    try {
      if (Platform.OS === "web") {
        await signInWithGoogleWeb();
      } else {
        await signInWithGoogleNative();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google sign-in failed";
      // Ignore user-closed popup
      if (msg.includes("popup-closed-by-user") || msg.includes("cancelled")) return;
      setError(msg);
    }
  };

  const signInWithPhone = async () => {
    setError("Phone sign-in coming soon.");
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign out failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, promptGoogleSignIn, signInWithPhone, logout, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
