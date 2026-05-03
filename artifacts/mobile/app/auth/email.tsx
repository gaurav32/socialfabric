import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth } from "@/lib/firebase";
import { useColors } from "@/hooks/useColors";

type Mode = "signin" | "signup";

export default function EmailAuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/(tabs)/home");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.heroGradientStart, colors.heroGradientEnd]} style={styles.bg}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
              paddingBottom: insets.bottom + 32,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>

          <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius * 1.5 }]}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Ionicons name="sparkles" size={28} color="#fff" />
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {mode === "signup" ? "Join 120k+ changemakers today" : "Sign in to continue"}
            </Text>

            {/* Mode toggle */}
            <View style={[styles.modeRow, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
              {(["signup", "signin"] as Mode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setError(null); }}
                  style={[
                    styles.modeBtn,
                    { borderRadius: colors.radius - 4 },
                    mode === m && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.modeBtnText, { color: mode === m ? "#fff" : colors.mutedForeground }]}>
                    {m === "signup" ? "Sign Up" : "Sign In"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Email */}
            <View style={[styles.inputWrapper, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.input }]}>
              <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Email address"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password */}
            <View style={[styles.inputWrapper, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.input, marginTop: 12 }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <Pressable onPress={() => setShowPassword((p) => !p)} style={{ padding: 4 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + "22", borderRadius: colors.radius / 2 }]}>
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: loading || pressed ? 0.8 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                    {mode === "signup" ? "Create Account" : "Sign In"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  back: { alignSelf: "flex-start", padding: 8, marginBottom: 12 },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 28,
    alignItems: "center",
    shadowColor: "#5B4FE8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrapper: { width: 56, height: 56, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24 },
  modeRow: { flexDirection: "row", padding: 4, marginBottom: 24, width: "100%" },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  errorBox: { marginTop: 14, padding: 12, width: "100%" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  submitBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
  },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
