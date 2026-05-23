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
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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

function extractIdToken(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.["id_token"];
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

async function firebaseSignInWithToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const googlePendingRef = useRef(false);

  // Safety-net: catches exp:// deep links if openAuthSessionAsync returns
  // "cancel" instead of "success" (e.g. Chrome dispatches an Android intent
  // and the Custom Tab closes before returning the URL to the JS layer).
  useEffect(() => {
    function handleUrl({ url }: { url: string }) {
      if (!googlePendingRef.current) return;
      if (!url.includes("google-callback")) return;
      const idToken = extractIdToken(url);
      if (idToken) {
        googlePendingRef.current = false;
        firebaseSignInWithToken(idToken).catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Firebase sign-in failed");
        });
      }
    }

    const sub = Linking.addEventListener("url", handleUrl);
    // Handle cold-start deep link
    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
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

  /** Web: Firebase handles the popup natively — no server proxy needed */
  const signInWithGoogleWeb = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    await signInWithPopup(auth, provider);
  };

  /** Native: server-side OAuth proxy → Linking listener
   *
   * We must use the exp:// custom scheme as the redirectUrl — not HTTPS.
   * openAuthSessionAsync on Android extracts only the SCHEME from redirectUrl
   * and watches for ANY URL with that scheme. Using "https" would cause the
   * tab to close the instant Chrome navigates to accounts.google.com.
   *
   * Instead, the server's HTML page uses an Android intent:// URL which
   * reliably opens Expo Go without a user gesture. The Linking listener
   * (above) catches the exp:// deep link and processes the token.
   * openAuthSessionAsync is still used to open and manage the browser tab.
   */
  const signInWithGoogleNative = async () => {
    const appRedirectUri = Linking.createURL("auth/google-callback");
    const startUrl =
      `${API_ORIGIN}/api/auth/google/start` +
      `?app_redirect_uri=${encodeURIComponent(appRedirectUri)}`;

    googlePendingRef.current = true;

    const result = await WebBrowser.openAuthSessionAsync(startUrl, appRedirectUri);

    // "success" — Chrome detected the exp:// redirect and returned it
    if (result.type === "success") {
      googlePendingRef.current = false;
      const idToken = extractIdToken(result.url);
      if (idToken) {
        await firebaseSignInWithToken(idToken);
      } else {
        const parsed = Linking.parse(result.url);
        const oauthError = parsed.queryParams?.["error"];
        setError(oauthError ? String(oauthError) : "No token received — please try again.");
      }
      return;
    }

    // "cancel" / "dismiss" — tab was closed; the Linking listener may have
    // already handled the token (Android intent fired before tab closed).
    // Wait briefly so the listener has time to fire.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (googlePendingRef.current) {
      // Listener didn't fire — user genuinely cancelled
      googlePendingRef.current = false;
      setError("Sign-in was cancelled.");
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
