import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.78;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  category: string;
  icon: string;
  timeAgo: string;
  text: string;
  location: string;
  replies: number;
}

interface Milestone {
  label: string;
  sub: string;
  date: string;
  done: boolean;
  active: boolean;
}

interface ProviderBid {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  description: string;
  deliveryLabel: string;
  deliveryTime: string;
  slots: string[];
  verified: boolean;
}

// ─── Mock detail data per question ───────────────────────────────────────────

const MILESTONES: Milestone[] = [
  { label: "Request Posted", sub: "Service request submitted by Aditya Kumar", date: "May 29", done: true, active: false },
  { label: "Bids Collected", sub: "3 providers submitted competitive bids", date: "Jun 1", done: true, active: false },
  { label: "Provider Selected", sub: "Community selects the best bid", date: "Jun 15", done: false, active: true },
  { label: "Service Scheduled", sub: "Time slot confirmed with provider", date: "Jun 18", done: false, active: false },
  { label: "Service Complete", sub: "Cycle serviced & review posted", date: "Jun 20", done: false, active: false },
];

const PROVIDER_BIDS: ProviderBid[] = [
  {
    id: "1",
    name: "Rajan Cycles",
    price: 450,
    rating: 4.8,
    reviewCount: 124,
    description: "Full tune-up & gear adjustment",
    deliveryLabel: "Same day",
    deliveryTime: "2h 30m",
    slots: ["9:00 AM", "11:30 AM", "3:00 PM"],
    verified: true,
  },
  {
    id: "2",
    name: "SpeedFix Pro",
    price: 380,
    rating: 4.6,
    reviewCount: 89,
    description: "Complete bike overhaul & cleaning",
    deliveryLabel: "Next day",
    deliveryTime: "4h",
    slots: ["10:00 AM", "2:00 PM"],
    verified: true,
  },
  {
    id: "3",
    name: "CycleHub Express",
    price: 520,
    rating: 4.9,
    reviewCount: 203,
    description: "Premium service with 1-month warranty",
    deliveryLabel: "Same day",
    deliveryTime: "1h 45m",
    slots: ["8:30 AM", "12:00 PM", "4:30 PM"],
    verified: false,
  },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const colors = useColors();
  const full = Math.floor(rating);
  return (
    <View style={star.row}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < full ? "star" : "star-outline"}
          size={12}
          color="#F59E0B"
        />
      ))}
      <Text style={[star.text, { color: colors.mutedForeground }]}>
        {rating} ({count})
      </Text>
    </View>
  );
}
const star = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  text: { fontSize: 11, marginLeft: 2 },
});

// ─── Milestone Step ───────────────────────────────────────────────────────────

function MilestoneStep({ step, isLast }: { step: Milestone; isLast: boolean }) {
  const colors = useColors();
  return (
    <View style={ms.row}>
      {/* Icon column */}
      <View style={ms.iconCol}>
        {step.done ? (
          <LinearGradient
            colors={["#7C6FF5", "#5B4FE8"]}
            style={ms.iconCircle}
          >
            <Ionicons name="checkmark" size={13} color="#fff" />
          </LinearGradient>
        ) : step.active ? (
          <View style={[ms.iconCircle, { backgroundColor: "#FFF4E0", borderWidth: 2, borderColor: "#F59E0B" }]}>
            <Ionicons name="checkbox-outline" size={13} color="#F59E0B" />
          </View>
        ) : (
          <View style={[ms.iconCircle, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}>
            <View style={[ms.dot, { backgroundColor: colors.mutedForeground }]} />
          </View>
        )}
        {!isLast && <View style={[ms.line, { backgroundColor: step.done ? colors.primary : colors.border }]} />}
      </View>

      {/* Content */}
      <View style={ms.content}>
        <View style={ms.titleRow}>
          <Text style={[ms.label, { color: step.done || step.active ? colors.text : colors.mutedForeground }]}>
            {step.label}
          </Text>
          <Text style={[ms.date, { color: step.done ? colors.primary : colors.mutedForeground }]}>
            {step.date}
          </Text>
        </View>
        <Text style={[ms.sub, { color: colors.mutedForeground }]}>{step.sub}</Text>
      </View>
    </View>
  );
}
const ms = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  iconCol: { alignItems: "center", width: 26 },
  iconCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  line: { width: 2, flex: 1, minHeight: 20, marginVertical: 3 },
  content: { flex: 1, paddingBottom: 18 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600" },
  date: { fontSize: 12, fontWeight: "500" },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
});

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({ bid, selected, onSelect }: { bid: ProviderBid; selected: boolean; onSelect: () => void }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [chosenSlot, setChosenSlot] = useState<string | null>(null);

  return (
    <Pressable
      style={[pc.card, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 }]}
      onPress={() => { setExpanded((e) => !e); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
    >
      {/* Top row */}
      <View style={pc.topRow}>
        <LinearGradient colors={["#7C6FF5", "#5B4FE8"]} style={pc.avatar}>
          <Ionicons name="bicycle-outline" size={15} color="#fff" />
        </LinearGradient>
        <View style={pc.nameCol}>
          <View style={pc.nameRow}>
            <Text style={[pc.name, { color: colors.text }]}>{bid.name}</Text>
            {bid.verified && <Ionicons name="checkmark-circle" size={14} color="#5B4FE8" style={{ marginLeft: 3 }} />}
          </View>
          <Text style={[pc.desc, { color: colors.mutedForeground }]}>{bid.description}</Text>
          <StarRating rating={bid.rating} count={bid.reviewCount} />
        </View>
        <View style={pc.priceCol}>
          <Text style={[pc.price, { color: colors.text }]}>₹{bid.price}</Text>
          <Text style={[pc.delivery, { color: "#2D8A44" }]}>{bid.deliveryLabel}</Text>
          <View style={pc.timeRow}>
            <Ionicons name="time-outline" size={11} color="#EF4444" />
            <Text style={[pc.time, { color: "#EF4444" }]}>{bid.deliveryTime}</Text>
          </View>
        </View>
      </View>

      {/* Expanded slots */}
      {expanded && (
        <View style={pc.slotsSection}>
          <Text style={[pc.slotsLabel, { color: colors.mutedForeground }]}>AVAILABLE SLOTS</Text>
          <View style={pc.slotsRow}>
            {bid.slots.map((slot) => (
              <Pressable
                key={slot}
                style={[
                  pc.slotPill,
                  {
                    backgroundColor: chosenSlot === slot ? colors.primary : colors.secondary,
                    borderColor: chosenSlot === slot ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { setChosenSlot(slot); onSelect(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[pc.slotText, { color: chosenSlot === slot ? "#fff" : colors.text }]}>{slot}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
}
const pc = StyleSheet.create({
  card: { borderRadius: 12, padding: 12, gap: 10 },
  topRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  nameCol: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 13, fontWeight: "700" },
  desc: { fontSize: 12 },
  priceCol: { alignItems: "flex-end", gap: 1 },
  price: { fontSize: 15, fontWeight: "700" },
  delivery: { fontSize: 11, fontWeight: "500" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  time: { fontSize: 11 },
  slotsSection: { gap: 6 },
  slotsLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  slotsRow: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  slotPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  slotText: { fontSize: 12, fontWeight: "500" },
});

// ─── Main Sheet ───────────────────────────────────────────────────────────────

interface Props {
  question: Question | null;
  onClose: () => void;
}

export default function QuestionDetailSheet({ question, onClose }: Props) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [showBids, setShowBids] = useState(true);
  const [selectedBid, setSelectedBid] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const visible = question !== null;

  useEffect(() => {
    if (visible) {
      setShowBids(false);
      setResolved(false);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!question) return null;

  const progressPct = "55%";
  const bidsCount = 3;
  const communityCount = 48;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={close}>
      {/* Dim backdrop */}
      <TouchableWithoutFeedback onPress={close}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            height: SHEET_HEIGHT,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <LinearGradient
            colors={["#7C6FF5", "#5B4FE8"]}
            style={styles.headerIcon}
          >
            <Ionicons name={question.icon as never} size={16} color="#fff" />
          </LinearGradient>
          <View style={[styles.activeBadge, { backgroundColor: "#E4FFE9" }]}>
            <Text style={[styles.activeBadgeText, { color: "#2D8A44" }]}>Active</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={close} hitSlop={10}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Scrollable body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{question.text}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{question.location}</Text>
          </View>

          {/* Service Status */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>SERVICE STATUS</Text>
            <Pressable
              style={styles.milestonesBtn}
              onPress={() => { setShowBids((b) => !b); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.milestonesBtnText, { color: colors.primary }]}>
                Milestones {showBids ? ">" : "∧"}
              </Text>
            </Pressable>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
            <LinearGradient
              colors={["#7C6FF5", "#5B4FE8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: progressPct }]}
            />
          </View>
          <View style={styles.bidCloseRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.bidCloseText, { color: colors.mutedForeground }]}>Bids close Jun 15, 2025</Text>
          </View>

          {/* Milestones list */}
          {showBids === false && (
            <View style={styles.milestonesList}>
              {MILESTONES.map((step, i) => (
                <MilestoneStep key={step.label} step={step} isLast={i === MILESTONES.length - 1} />
              ))}
            </View>
          )}

          {/* Calculating bid indicator */}
          <View style={[styles.calcRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.calcLeft}>
              <Animated.View>
                <Ionicons name="sync-outline" size={14} color={colors.primary} />
              </Animated.View>
              <Text style={[styles.calcText, { color: colors.mutedForeground }]}>Calculating best bid...</Text>
            </View>
            <View style={[styles.bidCountPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bidCountText, { color: colors.primary }]}>{bidsCount} bids</Text>
            </View>
          </View>

          {/* Provider Bids */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>PROVIDER BIDS</Text>
          </View>

          <View style={styles.providerList}>
            {PROVIDER_BIDS.map((bid) => (
              <ProviderCard
                key={bid.id}
                bid={bid}
                selected={selectedBid === bid.id}
                onSelect={() => setSelectedBid(bid.id)}
              />
            ))}
          </View>

          {/* Community interest */}
          <View style={styles.communityRow}>
            <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.communityText, { color: colors.mutedForeground }]}>
              {communityCount} community members interested
            </Text>
          </View>
        </ScrollView>

        {/* Sticky bottom button */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 12 : 24 }]}>
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setResolved(true);
              setTimeout(close, 800);
            }}
          >
            <LinearGradient
              colors={resolved ? ["#2D8A44", "#1B6B30"] : ["#2D8A44", "#22C55E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resolveBtn}
            >
              <Ionicons name={resolved ? "checkmark-circle" : "checkmark"} size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.resolveBtnText}>{resolved ? "Marked as Resolved!" : "Mark Resolved"}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  activeBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7 },
  activeBadgeText: { fontSize: 12, fontWeight: "600" },
  closeBtn: { marginLeft: "auto", width: 28, height: 28, alignItems: "center", justifyContent: "center" },

  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 12, paddingBottom: 8 },

  sheetTitle: { fontSize: 17, fontWeight: "700", lineHeight: 24 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13 },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  milestonesBtn: {
    paddingVertical: 2,
  },
  milestonesBtnText: { fontSize: 13, fontWeight: "700" },

  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  bidCloseRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: -6 },
  bidCloseText: { fontSize: 11 },

  milestonesList: { gap: 0 },

  calcRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  calcLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  calcText: { fontSize: 13 },
  bidCountPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  bidCountText: { fontSize: 12, fontWeight: "600" },

  providerList: { gap: 10 },

  communityRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 4 },
  communityText: { fontSize: 12 },

  footer: { borderTopWidth: 1, padding: 16 },
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 15,
  },
  resolveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
