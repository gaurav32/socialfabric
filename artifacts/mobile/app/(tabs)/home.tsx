import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import QuestionDetailSheet from "@/components/QuestionDetailSheet";
import type { Question } from "@/components/QuestionDetailSheet";
import CampaignDetailSheet from "@/components/CampaignDetailSheet";
import type { Campaign } from "@/components/CampaignDetailSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type HomeTab = "campaigns" | "askforhelp";


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
    title: "Clean & Facelift My Drain — Dwarka Sec 21",
    location: "Dwarka, New Delhi",
    icon: "water-outline",
    status: "new",
    completionPct: 0,
    endDate: "Sep 30, 2025",
    isNew: true,
    isRecommended: true,
    communityCount: 54,
    upiCode: "FABRIC-DWK21",
  },
  {
    id: "2",
    title: "Traffic Passway Dwarka Sector 21",
    location: "Dwarka, New Delhi",
    icon: "car-outline",
    status: "joined",
    completionPct: 67,
    endDate: "Jun 12, 2025",
    communityCount: 128,
    upiCode: "FABRIC-DWK21",
  },
  {
    id: "3",
    title: "Traffic Passway Andheri Link Road",
    location: "Andheri West, Mumbai",
    icon: "car-outline",
    status: "in_progress",
    completionPct: 45,
    endDate: "Jul 3, 2025",
    isRecommended: true,
    communityCount: 128,
    upiCode: "FABRIC-AND01",
  },
];

const LOCATIONS = [
  { label: "Banjara Hills", top: "14%", left: "46%", dotTop: "34%", dotLeft: "52%" },
  { label: "Dwarka Sec 21", top: "34%", left: "18%", dotTop: "54%", dotLeft: "26%" },
  { label: "Koramangala", top: "58%", left: "4%", dotTop: "76%", dotLeft: "10%" },
  { label: "Andheri", top: "26%", left: "65%", dotTop: "46%", dotLeft: "71%" },
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
      <View style={[styles.mapArea, { backgroundColor: "#ECEFFE" }]}>
        {/* Street grid — horizontal lines */}
        {([25, 50, 75] as const).map((pct) => (
          <View
            key={`h${pct}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${pct}%` as never,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.75)",
            }}
          />
        ))}
        {/* Street grid — vertical lines */}
        {([20, 40, 60, 80] as const).map((pct) => (
          <View
            key={`v${pct}`}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct}%` as never,
              width: 1,
              backgroundColor: "rgba(255,255,255,0.75)",
            }}
          />
        ))}

        {/* Indicator dots */}
        {LOCATIONS.map((loc) => (
          <View
            key={`dot-${loc.label}`}
            style={{
              position: "absolute",
              top: loc.dotTop as never,
              left: loc.dotLeft as never,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#312E81",
              borderWidth: 1.5,
              borderColor: "#fff",
            }}
          />
        ))}

        {/* Location bubbles */}
        {LOCATIONS.map((loc) => (
          <View
            key={loc.label}
            style={[
              styles.locationBubble,
              {
                backgroundColor: "#5B4FE8",
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

function QuestionCard({ item, onPress }: { item: Question; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.questionCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
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
    </Pressable>
  );
}

function CampaignCard({ item, onPress }: { item: Campaign; onPress: () => void }) {
  const colors = useColors();
  const isNew = item.status === "new";
  const isJoined = item.status === "joined";

  const borderColor = isNew ? "#F59E0B" : colors.border;
  const statusLabel = isNew ? "New Campaign" : isJoined ? "In Progress" : "In Progress";
  const statusBg = isNew ? colors.secondary : "#DBEAFE";
  const statusColor = isNew ? colors.mutedForeground : "#2563EB";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.campaignCard,
        {
          backgroundColor: colors.card,
          borderColor,
          borderWidth: isNew ? 1.5 : 1,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {/* "New in your area" banner */}
      {isNew && (
        <View style={styles.newBanner}>
          <Ionicons name="sparkles" size={11} color="#F59E0B" />
          <Text style={styles.newBannerText}>New in your area</Text>
        </View>
      )}

      {/* Top row */}
      <View style={styles.campaignTop}>
        <GradientIcon name={item.icon} size={40} iconSize={18} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.campaignTitleRow}>
            <Text style={[styles.campaignTitle, { color: colors.text, flex: 1 }]} numberOfLines={2}>
              {item.title}
            </Text>
            {isJoined ? (
              <View style={styles.joinedBadge}>
                <View style={styles.joinedDot} />
                <Text style={styles.joinedBadgeText}>Joined</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                hitSlop={8}
                style={styles.bookmarkBtn}
              >
                <Ionicons name="bookmark-outline" size={19} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Completion */}
      <View style={styles.completionSection}>
        <View style={styles.completionRow}>
          <Text style={[styles.completionLabel, { color: colors.mutedForeground }]}>COMPLETION</Text>
          <Text style={[styles.completionPct, { color: colors.text }]}>{item.completionPct}%</Text>
        </View>
        <View style={[styles.progressTrackCard, { backgroundColor: colors.secondary }]}>
          {item.completionPct > 0 && (
            <LinearGradient
              colors={["#3B82F6", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFillCard, { width: `${item.completionPct}%` }]}
            />
          )}
        </View>
        <View style={styles.cardMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.endDate}</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      {isNew ? (
        <LinearGradient
          colors={["#F59E0B", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaBtnText}>Join Campaign →</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.ctaBtnOutline, { borderColor: colors.primary }]}>
          <Text style={[styles.ctaBtnOutlineText, { color: colors.primary }]}>View Campaign</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HomeTab>("askforhelp");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<"all" | "new" | "recommended" | "joined">("all");

  const newCount = MOCK_CAMPAIGNS.filter((c) => c.isNew).length;
  const recommendedCount = MOCK_CAMPAIGNS.filter((c) => c.isRecommended).length;
  const joinedCount = MOCK_CAMPAIGNS.filter((c) => c.status === "joined").length;
  const filteredCampaigns =
    campaignFilter === "new"
      ? MOCK_CAMPAIGNS.filter((c) => c.isNew)
      : campaignFilter === "recommended"
      ? MOCK_CAMPAIGNS.filter((c) => c.isRecommended)
      : campaignFilter === "joined"
      ? MOCK_CAMPAIGNS.filter((c) => c.status === "joined")
      : MOCK_CAMPAIGNS;

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
        {/* ── Greeting + App Icon ── */}
        <View style={styles.greetingRow}>
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
          <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.appIconImage}
            />
          </Pressable>
        </View>

        {/* ── Live Map ── */}
        <LiveMapSection />

        {/* ── Tabs ── */}
        <View style={[styles.tabsBar, { borderBottomColor: colors.border }]}>
          {([
            { key: "askforhelp" as HomeTab, label: "Ask for Help" },
            { key: "campaigns" as HomeTab, label: "Active Campaigns" },
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
              <QuestionCard key={q.id} item={q} onPress={() => setSelectedQuestion(q)} />
            ))}
          </View>
        )}

        {/* ── Active Campaigns content ── */}
        {activeTab === "campaigns" && (
          <View style={styles.tabContent}>
            <View style={styles.campaignHeader}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterChipsScroll}
                contentContainerStyle={styles.filterChips}
              >
                {(
                  [
                    { key: "new", label: `${newCount} new` },
                    { key: "recommended", label: `${recommendedCount} recommended` },
                    { key: "joined", label: `${joinedCount} joined` },
                  ] as const
                ).map((chip) => {
                  const isActive = campaignFilter === chip.key;
                  return (
                    <Pressable
                      key={chip.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCampaignFilter(isActive && chip.key !== "all" ? "all" : chip.key);
                      }}
                      style={[
                        styles.filterChip,
                        isActive
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          { color: isActive ? "#fff" : colors.mutedForeground },
                        ]}
                      >
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                style={[styles.createBtn, { backgroundColor: colors.primary }]}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                <Ionicons name="add" size={15} color="#fff" style={{ marginRight: 3 }} />
                <Text style={styles.createBtnText}>Create</Text>
              </Pressable>
            </View>

            {filteredCampaigns.map((c) => (
              <CampaignCard key={c.id} item={c} onPress={() => setSelectedCampaign(c)} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom-sheet overlay */}
      <QuestionDetailSheet
        question={selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
      />

      {/* Campaign detail overlay */}
      <CampaignDetailSheet
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  // Greeting row
  greetingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greetingSection: { flex: 1, gap: 3 },
  greetingSmall: { fontSize: 13 },
  greetingName: { fontSize: 26, fontWeight: "800", lineHeight: 32 },
  communityRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  blueDot: { width: 7, height: 7, borderRadius: 4 },
  communityText: { fontSize: 13 },
  appIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  appIconImage: { width: 44, height: 44, borderRadius: 12 },

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
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 4,
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

  // Campaign section header
  campaignHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  campaignMeta: { fontSize: 13, fontWeight: "600" },
  filterChipsScroll: { flex: 1 },
  filterChips: { flexDirection: "row", gap: 6, alignItems: "center" },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  filterChipText: { fontSize: 10, fontWeight: "600" },
  createBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  createBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Campaign card
  campaignCard: { borderRadius: 16, padding: 14, gap: 12 },
  campaignTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  campaignTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  campaignTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  newBanner: { flexDirection: "row", alignItems: "center", gap: 5 },
  newBannerText: { fontSize: 12, fontWeight: "600", color: "#F59E0B" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: "600" },
  joinedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  joinedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  joinedBadgeText: { fontSize: 12, fontWeight: "600", color: "#16A34A" },
  bookmarkBtn: { padding: 2 },

  // Completion in card
  completionSection: { gap: 6 },
  completionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  completionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  completionPct: { fontSize: 14, fontWeight: "700" },
  progressTrackCard: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFillCard: { height: 5, borderRadius: 3 },
  cardMetaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11 },

  // CTA buttons in card
  ctaBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  ctaBtnOutline: { borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: "center" },
  ctaBtnOutlineText: { fontSize: 15, fontWeight: "600" },
});
