import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATS = [
  { value: "43", label: "Cities" },
  { value: "8", label: "Movements" },
  { value: "120k", label: "Members" },
];

export default function PreLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, loading, promptGoogleSignIn, signInWithPhone, error } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await promptGoogleSignIn();
  };

  const handlePhone = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signInWithPhone();
  };

  const handleEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/auth/email");
  };

  const handleSignIn = () => {
    router.push("/auth/email");
  };

  return (
    <LinearGradient
      colors={[colors.heroGradientStart, colors.heroGradientEnd]}
      style={styles.gradientBg}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 20,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius * 1.5, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Logo */}
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <Ionicons name="sparkles" size={32} color="#fff" />
          </View>

          <Text style={[styles.appName, { color: colors.foreground }]}>Social Fabric</Text>
          <View style={[styles.tagPill, { backgroundColor: colors.secondary, borderRadius: 20 }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>Community for changemakers</Text>
          </View>

          {/* Hero */}
          <Text style={[styles.heroText, { color: colors.foreground }]}>Fix what matters.{"\n"}Together.</Text>
          <Text style={[styles.subText, { color: colors.mutedForeground }]}>
            Join 120,000+ young people tackling real problems — mental health, climate, inequality, and more.
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map((stat) => (
              <View key={stat.label} style={[styles.statChip, { backgroundColor: colors.statBg, borderRadius: 20 }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.statText }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <Pressable
            onPress={handleGoogle}
            style={({ pressed }) => [styles.outlineBtn, { borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.75 : 1 }]}
          >
            <Image
              source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/32px-Google_%22G%22_logo.svg.png" }}
              style={styles.googleIcon}
            />
            <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={handlePhone}
            style={({ pressed }) => [styles.outlineBtn, { borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.75 : 1, marginTop: 12 }]}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.outlineBtnText, { color: colors.foreground }]}>Continue with Phone</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          </View>

          {/* Email CTA */}
          <Pressable
            onPress={handleEmail}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Get Started with Email</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
          </Pressable>

          {/* Sign in link */}
          <Text style={[styles.signInRow, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
            <Text onPress={handleSignIn} style={{ color: colors.linkText, fontFamily: "Inter_600SemiBold" }}>
              Sign in
            </Text>
          </Text>

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "22", borderRadius: colors.radius / 2 }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            By continuing you agree to our{" "}
            <Text style={{ color: colors.linkText }}>Terms</Text> &{" "}
            <Text style={{ color: colors.linkText }}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flexGrow: 1, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
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
  iconWrapper: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 24,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  heroText: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 12,
  },
  subText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  outlineBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  outlineBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  signInRow: {
    marginTop: 16,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  errorBox: { marginTop: 14, padding: 12, width: "100%" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  terms: {
    marginTop: 16,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
  },
  devBox: {
    marginTop: 16,
    padding: 12,
    width: "100%",
    gap: 4,
  },
  devLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  devUri: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  devHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 15,
  },
});
