import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import React, { createContext, useContext, useEffect, useState } from "react";

import { auth } from "@/lib/firebase";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  promptGoogleSignIn: () => Promise<void>;
  signInWithPhone: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  googleRedirectUri: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  promptGoogleSignIn: async () => {},
  signInWithPhone: async () => {},
  logout: async () => {},
  error: null,
  googleRedirectUri: "",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    responseType: "id_token",
    usePKCE: false,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (!id_token) {
        setError("Google did not return an ID token.");
        return;
      }
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Firebase credential failed");
      });
    } else if (response?.type === "error") {
      setError(response.error?.message ?? "Google sign-in failed.");
    } else if (response?.type === "cancel") {
      setError("Sign-in was cancelled.");
    }
  }, [response]);

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
    if (!request) {
      setError("Google Sign-In is not ready. Please wait a moment and try again.");
      return;
    }
    await promptAsync();
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
      value={{
        user,
        loading,
        promptGoogleSignIn,
        signInWithPhone,
        logout,
        error,
        googleRedirectUri: request?.redirectUri ?? "",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
