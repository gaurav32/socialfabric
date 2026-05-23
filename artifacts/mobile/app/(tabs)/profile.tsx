import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const REFERRAL_CODE = "FABRIC-ADI2025";

function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <LinearGradient
      colors={["#7C6FF5", "#5B4FE8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.26 }]}
    >
      <Text style={[styles.avatarText, { color: "#fff", fontSize: size * 0.36 }]}>
        {initials}
      </Text>
    </LinearGradient>
  );
}

function SectionLabel({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
      {label.toUpperCase()}
    </Text>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

const DEFAULT_ICON_GRADIENT: readonly [string, string] = ["#7C6FF5", "#5B4FE8"];

function RowItem({
  icon,
  label,
  subtitle,
  right,
  onPress,
  showChevron = true,
  isLast = false,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
}) {
  const colors = useColors();
  const gradient = DEFAULT_ICON_GRADIENT;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.rowIcon}
      >
        <Ionicons name={icon as never} size={15} color="#fff" />
      </LinearGradient>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right ?? (showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      ) : null)}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const { width } = useWindowDimensions();

  const hp = (pct: number) => width * pct;

  const displayName = user?.displayName ?? "Dev User";
  const email = user?.email ?? "dev@socialfabric.app";

  const avatarSize = hp(0.142);
  const iconCircleSize = hp(0.175);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(REFERRAL_CODE);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      logout();
      router.replace("/");
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background }]}>
    <ScrollView
      style={[styles.root, Platform.OS === "web" && { overflow: "scroll" as "scroll" }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <Image
          source={require("@/assets/images/icon.png")}
          style={{
            width: iconCircleSize,
            height: iconCircleSize,
            borderRadius: iconCircleSize / 2,
          }}
          resizeMode="cover"
        />
      </View>

      {/* ── User Card ── */}
      <Card style={styles.userCard}>
        <Avatar name={displayName} size={avatarSize} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{email}</Text>
          </View>
        </View>
        <Pressable
          style={styles.editLink}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Text style={[styles.editLinkText, { color: colors.primary }]}>Edit</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </Pressable>
      </Card>

      {/* ── Social Score + Coins ── */}
      <View style={styles.statsRow}>
        {/* Social Score */}
        <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
          <View style={styles.scoreHeader}>
            <View style={[styles.scoreStar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="star" size={14} color="#FFD700" />
            </View>
            <Text style={styles.scoreLabel}>Social Score</Text>
          </View>
          <Text style={styles.scoreValue}>720</Text>
          <Text style={styles.scoreHint}>Complete KYC to unlock higher score</Text>
        </View>

        {/* Coins */}
        <View style={[styles.coinsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.coinsHeader}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={[styles.coinsLabel, { color: colors.mutedForeground }]}>Coins</Text>
          </View>
          <Text style={[styles.coinsValue, { color: colors.text }]}>200</Text>
          <Text style={[styles.coinsHint, { color: colors.mutedForeground }]}>From 2 completed tasks</Text>
        </View>
      </View>

      {/* ── Account ── */}
      <SectionLabel label="Account" />
      <Card>
        <RowItem
          icon="shield-checkmark-outline"
          label="KYC Verification"
          subtitle="Identity not verified"
          showChevron={false}
          right={
            <View style={[styles.pendingBadge, { backgroundColor: "#FFF4E5" }]}>
              <Text style={[styles.pendingText, { color: "#F59E0B" }]}>Pending</Text>
            </View>
          }
        />
        <RowItem
          icon="language-outline"
          label="Language"
          subtitle="English"
          isLast
        />
      </Card>

      {/* ── Grow the Community ── */}
      <View style={[styles.growCard, { backgroundColor: colors.primary }]}>
        <View style={styles.growHeader}>
          <Ionicons name="people-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
          <Text style={styles.growTitle}>GROW THE COMMUNITY</Text>
        </View>
        <Text style={styles.growSubtitle}>
          Invite friends and earn social score points for every person who joins.
        </Text>

        {/* Referral code */}
        <View style={[styles.referralRow, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Text style={styles.referralCode}>{REFERRAL_CODE}</Text>
          <Pressable style={styles.copyBtn} onPress={handleCopy}>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color="#fff" />
            <Text style={styles.copyText}>{copied ? "Copied" : "Copy"}</Text>
          </Pressable>
        </View>

        {/* Invite button */}
        <Pressable
          style={[styles.inviteBtn, { backgroundColor: "#fff" }]}
          onPress={() => {}}
        >
          <Ionicons name="person-add-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.inviteBtnText, { color: colors.primary }]}>Invite Friends</Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.growStats}>
          {[
            { value: "12", label: "Invited" },
            { value: "3", label: "Joined" },
            { value: "+45", label: "Pts earned" },
          ].map((stat) => (
            <View key={stat.label} style={styles.growStat}>
              <Text style={styles.growStatValue}>{stat.value}</Text>
              <Text style={styles.growStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Legal & Support ── */}
      <SectionLabel label="Legal & Support" />
      <Card>
        <RowItem icon="document-text-outline" label="Terms of Service" />
        <RowItem icon="lock-closed-outline" label="Privacy Policy" />
        <RowItem icon="thumbs-up-outline" label="Rate App" subtitle="Tell us what you think" />
        <RowItem
          icon="information-circle-outline"
          label="About"
          subtitle="v1.0.0 · Social Fabric"
          isLast
        />
      </Card>

      {/* ── Sign Out ── */}
      <Pressable
        style={[styles.signOutBtn, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={[styles.signOutText, { color: "#EF4444" }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: { flex: 1 },
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },

  // User card
  userCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "700" },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "700", marginBottom: 3 },
  emailRow: { flexDirection: "row", alignItems: "center" },
  userEmail: { fontSize: 12 },
  editLink: { flexDirection: "row", alignItems: "center", gap: 1, paddingVertical: 4, paddingLeft: 8, paddingRight: 10 },
  editLinkText: { fontSize: 13, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  scoreCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  scoreHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  scoreStar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scoreLabel: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  scoreValue: { color: "#fff", fontSize: 36, fontWeight: "800", lineHeight: 40 },
  scoreHint: { color: "rgba(255,255,255,0.7)", fontSize: 11, lineHeight: 15, marginTop: 4 },

  coinsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  coinsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  coinEmoji: { fontSize: 20 },
  coinsLabel: { fontSize: 13, fontWeight: "600" },
  coinsValue: { fontSize: 36, fontWeight: "800", lineHeight: 40 },
  coinsHint: { fontSize: 11, lineHeight: 15, marginTop: 4 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 4,
    marginLeft: 4,
  },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Row item
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowSubtitle: { fontSize: 12, marginTop: 1 },

  pendingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: { fontSize: 12, fontWeight: "600" },

  // Grow card
  growCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  growHeader: { flexDirection: "row", alignItems: "center" },
  growTitle: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  growSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19 },

  referralRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  referralCode: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 1 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { color: "#fff", fontSize: 13, fontWeight: "500" },

  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 13,
  },
  inviteBtnText: { fontSize: 15, fontWeight: "600" },

  growStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 4,
  },
  growStat: { alignItems: "center", gap: 2 },
  growStatValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  growStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11 },

  // Sign out
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  signOutText: { fontSize: 16, fontWeight: "600" },
});
