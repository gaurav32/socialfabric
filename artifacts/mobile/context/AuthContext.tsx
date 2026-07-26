import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const API_ORIGIN = "https://api.socialfabric.co.in";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  promptGoogleSignIn: () => Promise<void>;
  signInWithPhone: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  promptGoogleSignIn: async () => {},
  signInWithPhone: async () => {},
  logout: async () => {},
  error: null,
  setError: () => {},
});

function extractCustomToken(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.["custom_token"];
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

async function firebaseSignInWithCustomToken(customToken: string) {
  await signInWithCustomToken(auth, customToken);
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
      const customToken = extractCustomToken(url);
      if (customToken) {
        googlePendingRef.current = false;
        firebaseSignInWithCustomToken(customToken).catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Firebase sign-in failed");
        });
      }
    }

    const sub = Linking.addEventListener("url", handleUrl);
    // Handle cold-start deep link
    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    return () => sub.remove();
  }, []);

  // There's no global auth-gate redirect elsewhere in the app — index.tsx's
  // own <Redirect> only fires while index.tsx is the mounted screen, which
  // it isn't for native Google sign-in (that flow navigates to
  // /auth/google-callback). Centralizing the post-sign-in redirect here
  // means it fires regardless of which of the several native completion
  // paths (openAuthSessionAsync result, the Linking safety-net, or
  // google-callback.tsx) actually completes the sign-in first, without
  // duplicating navigation logic in each of them. Skipped on the initial
  // auth-state hydration so an already-signed-in cold start doesn't force
  // an unwanted redirect away from wherever the app is opening to.
  const isFirstAuthCheck = useRef(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const isFirstCheck = isFirstAuthCheck.current;
      isFirstAuthCheck.current = false;

      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        await AsyncStorage.setItem("user_uid", firebaseUser.uid);
        if (!isFirstCheck) {
          router.replace("/(tabs)/home");
        }
      } else {
        await AsyncStorage.removeItem("user_uid");
      }
    });
    return unsubscribe;
  }, []);

  /** Web: same server-side OAuth proxy as native, via a popup window.
   *
   * The popup navigates through /api/auth/google/start → Google consent →
   * /api/auth/google/callback, which redirects the popup to our own
   * /auth/google-callback page with ?custom_token=. That page (running
   * inside the popup) postMessages the token back to this window and
   * closes itself — see app/auth/google-callback.tsx.
   */
  const signInWithGoogleWeb = () => {
    return new Promise<void>((resolve, reject) => {
      const appRedirectUri = `${window.location.origin}/auth/google-callback`;
      const startUrl =
        `${API_ORIGIN}/api/auth/google/start` +
        `?app_redirect_uri=${encodeURIComponent(appRedirectUri)}`;

      const popup = window.open(startUrl, "google-signin", "width=500,height=650");
      if (!popup) {
        reject(new Error("Popup was blocked. Please allow popups and try again."));
        return;
      }

      let settled = false;

      const pollTimer = window.setInterval(() => {
        if (popup.closed && !settled) {
          cleanup();
          reject(new Error("Sign-in was cancelled."));
        }
      }, 500);

      function cleanup() {
        window.removeEventListener("message", onMessage);
        window.clearInterval(pollTimer);
      }

      function onMessage(event: MessageEvent) {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== "google-auth") return;

        settled = true;
        cleanup();
        popup?.close();

        if (event.data.error) {
          reject(new Error(String(event.data.error)));
          return;
        }
        const customToken = event.data.customToken;
        if (typeof customToken !== "string") {
          reject(new Error("No token received — please try again."));
          return;
        }
        firebaseSignInWithCustomToken(customToken).then(resolve).catch(reject);
      }

      window.addEventListener("message", onMessage);
    });
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
      const customToken = extractCustomToken(result.url);
      if (customToken) {
        await firebaseSignInWithCustomToken(customToken);
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
      value={{ user, loading, promptGoogleSignIn, signInWithPhone, logout, error, setError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
