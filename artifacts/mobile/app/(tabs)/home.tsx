import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type HomeTab = "campaigns" | "askforhelp";

interface Question {
  id: string;
  category: string;
  icon: string;
  timeAgo: string;
  text: string;
  location: string;
  replies: number;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  supporters: number;
  daysLeft: number;
  icon: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_QUESTIONS: Question[] = [
  {
    id: "1",
    category: "Barber",
    icon: "cut-outline",
    timeAgo: "2h ago",
    text: "Can anyone recommend a good barber near Dwarka Sec 21? Looking for a clean fade.",
    location: "Dwarka Sec 21, New Delhi",
    replies: 3,
  },
  {
    id: "2",
    category: "Bike Service",
    icon: "construct-outline",
    timeAgo: "5h ago",
    text: "Where can I book a quick bike service for my Royal Enfield in the Dwarka area?",
    location: "Dwarka, New Delhi",
    replies: 7,
  },
  {
    id: "3",
    category: "Electrician",
    icon: "flash-outline",
    timeAgo: "1d ago",
    text: "Need a reliable electrician for switchboard repair in Rohini Sector 15.",
    location: "Rohini, New Delhi",
    replies: 2,
  },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    title: "Fix Potholes on Dwarka Expressway",
    description: "Residents demanding urgent road repairs before monsoon season hits.",
    supporters: 1240,
    daysLeft: 8,
    icon: "construct-outline",
  },
  {
    id: "2",
    title: "Plant 500 Trees in Sector 21 Park",
    description: "Community green drive to restore the local park's tree cover.",
    supporters: 876,
    daysLeft: 14,
    icon: "leaf-outline",
  },
  {
    id: "3",
    title: "Better Street Lighting in Koramangala",
    description: "Petition for improved street lighting for safety after 9 PM.",
    supporters: 2100,
    daysLeft: 5,
    icon: "bulb-outline",
  },
];

const LOCATIONS = [
  { label: "Banjara Hills", top: "18%", left: "48%", color: "#5B4FE8" },
  { label: "Dwarka Sec 21", top: "38%", left: "22%", color: "#E8380F" },
  { label: "Koramangala", top: "62%", left: "10%", color: "#5B4FE8" },
  { label: "Andheri", top: "30%", left: "68%", color: "#5B4FE8" },
];

const ICON_GRADIENT: readonly [string, string] = ["#7C6FF5", "#5B4FE8"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradientIcon({ name, size = 36, iconSize = 16 }: { name: string; size?: number; iconSize?: number }) {
  return (
    <LinearGradient
      colors={ICON_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons name={name as never} size={iconSize} color="#fff" />
    </LinearGradient>
  );
}

function LiveMapSection() {
  const colors = useColors();
  const [zoom, setZoom] = useState(1);

  return (
    <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Label */}
      <View style={styles.mapLabel}>
        <View style={styles.redDot} />
        <Text style={[styles.mapLabelText, { color: colors.text }]}>Live Map</Text>
      </View>

      {/* Map area */}
      <View style={[styles.mapArea, { backgroundColor: "#D8E8F5" }]}>
        {/* Grid lines */}
        <View style={[styles.mapGrid, { borderColor: "#C0D4E8" }]} />

        {/* Location bubbles */}
        {LOCATIONS.map((loc) => (
          <View
            key={loc.label}
            style={[
              styles.locationBubble,
              {
                backgroundColor: loc.color,
                top: loc.top as never,
                left: loc.left as never,
              },
            ]}
          >
            <Text style={styles.locationBubbleText}>{loc.label}</Text>
          </View>
        ))}

        {/* Zoom controls */}
        <View style={[styles.zoomControls, { backgroundColor: colors.card }]}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setZoom((z) => Math.min(z + 0.2, 2));
            }}
          >
            <Text style={[styles.zoomBtnText, { color: colors.text }]}>+</Text>
          </Pressable>
          <View style={[styles.zoomDivider, { backgroundColor: colors.border }]} />
          <Pressable
            style={styles.zoomBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setZoom((z) => Math.max(z - 0.2, 0.5));
            }}
          >
            <Text style={[styles.zoomBtnText, { color: colors.text }]}>−</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function QuestionCard({ item }: { item: Question }) {
  const colors = useColors();
  return (
    <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row */}
      <View style={styles.questionTop}>
        <GradientIcon name={item.icon} size={34} iconSize={15} />
        <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{item.category}</Text>
        </View>
        <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{item.timeAgo}</Text>
      </View>

      {/* Question text */}
      <Text style={[styles.questionText, { color: colors.text }]}>{item.text}</Text>

      {/* Footer */}
      <View style={styles.questionFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{item.location}</Text>
        </View>
        <Text style={[styles.repliesText, { color: colors.primary }]}>{item.replies} replies</Text>
      </View>
    </View>
  );
}

function CampaignCard({ item }: { item: Campaign }) {
  const colors = useColors();
  return (
    <View style={[styles.campaignCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.campaignTop}>
        <GradientIcon name={item.icon} size={40} iconSize={18} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.campaignTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.campaignDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
      <View style={styles.campaignFooter}>
        <View style={styles.campaignStat}>
          <Ionicons name="people-outline" size={13} color={colors.primary} />
          <Text style={[styles.campaignStatText, { color: colors.primary }]}>
            {item.supporters.toLocaleString()} supporters
          </Text>
        </View>
        <View style={[styles.daysLeftBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.daysLeftText, { color: colors.primary }]}>{item.daysLeft}d left</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HomeTab>("askforhelp");

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Changemaker";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress pill ── */}
        <View style={styles.progressRow}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressPill}
          >
            <Ionicons name="compass-outline" size={13} color="#fff" style={{ marginRight: 5 }} />
            <Text style={styles.progressText}>Step 1 of 5 · Discover</Text>
          </LinearGradient>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingSmall, { color: colors.mutedForeground }]}>{greeting}</Text>
          <Text style={[styles.greetingName, { color: colors.text }]}>{displayName} 👋</Text>
          <View style={styles.communityRow}>
            <View style={[styles.blueDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.communityText, { color: colors.mutedForeground }]}>
              Community for changemakers
            </Text>
          </View>
        </View>

        {/* ── Live Map ── */}
        <LiveMapSection />

        {/* ── Tabs ── */}
        <View style={[styles.tabsBar, { borderBottomColor: colors.border }]}>
          {([ 
            { key: "campaigns" as HomeTab, label: "Active Campaigns" },
            { key: "askforhelp" as HomeTab, label: "Ask for Help" },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.text : colors.mutedForeground },
                    isActive && { fontWeight: "700" },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Ask for Help content ── */}
        {activeTab === "askforhelp" && (
          <View style={styles.tabContent}>
            {/* Count + button row */}
            <View style={styles.questionHeader}>
              <Text style={[styles.questionCount, { color: colors.mutedForeground }]}>
                {MOCK_QUESTIONS.length} questions
              </Text>
              <Pressable
                style={[styles.askBtn, { backgroundColor: colors.primary }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.askBtnText}>Ask for Help</Text>
              </Pressable>
            </View>

            {/* Question cards */}
            {MOCK_QUESTIONS.map((q) => (
              <QuestionCard key={q.id} item={q} />
            ))}
          </View>
        )}

        {/* ── Active Campaigns content ── */}
        {activeTab === "campaigns" && (
          <View style={styles.tabContent}>
            <View style={styles.questionHeader}>
              <Text style={[styles.questionCount, { color: colors.mutedForeground }]}>
                {MOCK_CAMPAIGNS.length} campaigns
              </Text>
              <Pressable
                style={[styles.askBtn, { backgroundColor: colors.primary }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.askBtnText}>New Campaign</Text>
              </Pressable>
            </View>

            {MOCK_CAMPAIGNS.map((c) => (
              <CampaignCard key={c.id} item={c} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  // Progress
  progressRow: { alignItems: "center" },
  progressPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  progressText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Greeting
  greetingSection: { gap: 3 },
  greetingSmall: { fontSize: 13 },
  greetingName: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  communityRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  blueDot: { width: 7, height: 7, borderRadius: 4 },
  communityText: { fontSize: 13 },

  // Map
  mapCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 10 },
  mapLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#EF4444" },
  mapLabelText: { fontSize: 13, fontWeight: "600" },
  mapArea: { height: 140, borderRadius: 12, overflow: "hidden", position: "relative" },
  mapGrid: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 0,
  },
  locationBubble: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  locationBubbleText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  zoomControls: {
    position: "absolute",
    right: 10,
    top: "25%",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  zoomBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  zoomBtnText: { fontSize: 18, fontWeight: "600", lineHeight: 22 },
  zoomDivider: { height: 1, marginHorizontal: 4 },

  // Tabs
  tabsBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingBottom: 10,
    paddingRight: 20,
  },
  tabLabel: { fontSize: 14 },

  // Tab content
  tabContent: { gap: 12 },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  questionCount: { fontSize: 13 },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  askBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Question card
  questionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  questionTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7 },
  categoryBadgeText: { fontSize: 12, fontWeight: "600" },
  timeAgo: { fontSize: 12, marginLeft: "auto" },
  questionText: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
  questionFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontSize: 12 },
  repliesText: { fontSize: 13, fontWeight: "600" },

  // Campaign card
  campaignCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  campaignTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  campaignTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  campaignDesc: { fontSize: 13, lineHeight: 19 },
  campaignFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  campaignStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  campaignStatText: { fontSize: 13, fontWeight: "500" },
  daysLeftBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  daysLeftText: { fontSize: 12, fontWeight: "600" },
});
