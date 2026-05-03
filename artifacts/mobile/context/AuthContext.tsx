import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

// The API server's OAuth start endpoint (goes through shared proxy)
const API_BASE = "/api";

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

function getProxyOrigin(): string {
  if (Platform.OS === "web") {
    return window.location.origin;
  }
  // In Expo Go on a device, the dev domain is injected as an env var
  const devDomain = process.env["EXPO_PUBLIC_API_URL"] ?? "";
  if (devDomain) return devDomain;
  // Fallback: use the Replit dev domain from the environment
  return "https://a5fcae06-0b34-4951-9dfd-cef9d6f6c0c3-00-l4iig0njt0xp.pike.replit.dev";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pendingGoogleRef = useRef(false);

  // Handle deep-link callbacks from the OAuth server redirect
  useEffect(() => {
    function handleUrl(event: { url: string }) {
      if (!pendingGoogleRef.current) return;
      const parsed = Linking.parse(event.url);
      const idToken = parsed.queryParams?.["id_token"];
      const oauthError = parsed.queryParams?.["error"];

      if (oauthError) {
        setError(String(oauthError));
        pendingGoogleRef.current = false;
        return;
      }

      if (idToken && typeof idToken === "string") {
        pendingGoogleRef.current = false;
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential).catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Firebase sign-in failed");
        });
      }
    }

    const sub = Linking.addEventListener("url", handleUrl);

    // Handle the case where the app was cold-started by a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

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

  const promptGoogleSignIn = async () => {
    setError(null);
    try {
      // The app deep-link that the server will redirect back to
      const appRedirectUri = Linking.createURL("auth/google-callback");

      const origin = getProxyOrigin();
      const startUrl =
        `${origin}${API_BASE}/auth/google/start?app_redirect_uri=${encodeURIComponent(appRedirectUri)}`;

      pendingGoogleRef.current = true;

      const result = await WebBrowser.openAuthSessionAsync(startUrl, appRedirectUri);

      if (result.type === "cancel" || result.type === "dismiss") {
        pendingGoogleRef.current = false;
        setError("Sign-in was cancelled.");
      } else if (result.type === "success") {
        // URL is handled by the Linking listener above, but parse here as fallback
        const parsed = Linking.parse(result.url);
        const idToken = parsed.queryParams?.["id_token"];
        const oauthError = parsed.queryParams?.["error"];
        pendingGoogleRef.current = false;

        if (oauthError) {
          setError(String(oauthError));
        } else if (idToken && typeof idToken === "string") {
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
        }
      }
    } catch (e: unknown) {
      pendingGoogleRef.current = false;
      setError(e instanceof Error ? e.message : "Google sign-in failed");
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
    <AuthContext.Provider value={{ user, loading, promptGoogleSignIn, signInWithPhone, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
