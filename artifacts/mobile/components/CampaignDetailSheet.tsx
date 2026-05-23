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
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  title: string;
  location: string;
  icon: string;
  status: "new" | "in_progress" | "joined";
  completionPct: number;
  endDate: string;
  isNew?: boolean;
  communityCount: number;
  upiCode: string;
}

interface TimelineStep {
  label: string;
  date: string;
  status: "done" | "active" | "pending";
  detail?: string;
  progressPct?: number;
}

interface VendorBid {
  id: string;
  name: string;
  amount: string;
  currency: string;
  etaDays: number;
  icon: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TIMELINE: TimelineStep[] = [
  { label: "Site Survey & Planning", date: "Jan 15, 2025", status: "done" },
  { label: "Foundation & Excavation", date: "Feb 20, 2025", status: "done" },
  {
    label: "Road Base & Paving",
    date: "May 10, 2025",
    status: "active",
    detail: "Paving underway from Andheri West to Juhu junction. 45% of the road surface completed.",
    progressPct: 45,
  },
  { label: "Utilities & Drainage", date: "Jun 1, 2025", status: "pending" },
  { label: "Finishing & Inspection", date: "Jul 3, 2025", status: "pending" },
];

const VENDOR_BIDS: VendorBid[] = [
  { id: "1", name: "BuildRight Infra", amount: "29,000", currency: "$", etaDays: 75, icon: "business-outline" },
  { id: "2", name: "CityPave Group", amount: "31,500", currency: "$", etaDays: 65, icon: "construct-outline" },
];

// ─── QR Code visual placeholder ──────────────────────────────────────────────

function QRCodePlaceholder({ size }: { size: number }) {
  const cell = size / 10;
  // 10x10 grid pattern mimicking a QR code
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,1,0,1],
    [1,1,1,1,1,1,1,0,1,0],
    [0,0,0,1,0,0,0,1,1,0],
    [1,0,1,0,1,1,1,0,1,1],
    [0,1,0,1,0,0,1,1,0,1],
  ];
  return (
    <View style={{ width: size, height: size, backgroundColor: "#fff", padding: 6, borderRadius: 8 }}>
      {pattern.map((row, r) => (
        <View key={r} style={{ flexDirection: "row" }}>
          {row.map((cell_val, c) => (
            <View
              key={c}
              style={{
                width: cell,
                height: cell,
                backgroundColor: cell_val ? "#1D4ED8" : "transparent",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Contribute Modal ─────────────────────────────────────────────────────────

function ContributeModal({ visible, upiCode, onClose }: { visible: boolean; upiCode: string; onClose: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.85, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={cm.backdrop} onPress={onClose} />
      <View style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
        <View style={[cm.center, { pointerEvents: "box-none" }]}>
          <Animated.View
            style={[
              cm.card,
              { backgroundColor: colors.card, transform: [{ scale }], opacity },
            ]}
          >
            <Text style={[cm.title, { color: colors.text }]}>Scan to Contribute</Text>
            <Text style={[cm.subtitle, { color: colors.mutedForeground }]}>
              Scan the QR code to contribute to this campaign
            </Text>

            <View style={cm.qrWrap}>
              <QRCodePlaceholder size={160} />
            </View>

            <Text style={[cm.upiText, { color: colors.text }]}>
              {upiCode}
              <Text style={{ color: colors.mutedForeground }}> · UPI / Bank Transfer</Text>
            </Text>

            <Pressable
              style={[cm.closeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[cm.closeBtnText, { color: colors.primary }]}>Close</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
const cm = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, textAlign: "center" },
  qrWrap: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 4,
  },
  upiText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  closeBtn: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: { fontSize: 16, fontWeight: "600" },
});

// ─── Timeline Step ────────────────────────────────────────────────────────────

function TimelineItem({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(step.status === "active");

  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <View style={tl.row}>
      {/* Icon + line */}
      <View style={tl.iconCol}>
        {isDone ? (
          <LinearGradient colors={["#22C55E", "#16A34A"]} style={tl.circle}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </LinearGradient>
        ) : isActive ? (
          <View style={[tl.circle, { backgroundColor: "#EFF6FF", borderWidth: 2, borderColor: "#3B82F6" }]}>
            <Ionicons name="time-outline" size={13} color="#3B82F6" />
          </View>
        ) : (
          <View style={[tl.circle, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}>
            <View style={[tl.dot, { backgroundColor: colors.mutedForeground }]} />
          </View>
        )}
        {!isLast && (
          <View style={[tl.line, { backgroundColor: isDone ? "#22C55E" : colors.border }]} />
        )}
      </View>

      {/* Content */}
      <Pressable
        style={tl.content}
        onPress={() => {
          if (step.detail) {
            setExpanded((e) => !e);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <View style={tl.titleRow}>
          <Text style={[tl.label, { color: isDone || isActive ? colors.text : colors.mutedForeground, fontWeight: isActive ? "700" : "600" }]}>
            {step.label}
          </Text>
          {isDone && (
            <View style={tl.doneBadge}>
              <Text style={tl.doneBadgeText}>Done</Text>
            </View>
          )}
          {isActive && (
            <View style={tl.activeBadge}>
              <Text style={tl.activeBadgeText}>Active</Text>
            </View>
          )}
          {step.detail && (
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-forward"}
              size={14}
              color={colors.mutedForeground}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <View style={tl.dateRow}>
          <Ionicons name="calendar-outline" size={11} color={colors.mutedForeground} />
          <Text style={[tl.date, { color: colors.mutedForeground }]}>{step.date}</Text>
        </View>

        {/* Expanded detail */}
        {expanded && step.detail && (
          <View style={[tl.detailBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[tl.detailText, { color: colors.mutedForeground }]}>{step.detail}</Text>
            {step.progressPct !== undefined && (
              <View style={{ marginTop: 8, gap: 4 }}>
                <View style={tl.progressRow}>
                  <Text style={[tl.progressLabel, { color: colors.mutedForeground }]}>Progress</Text>
                  <Text style={[tl.progressPct, { color: colors.primary }]}>{step.progressPct}%</Text>
                </View>
                <View style={[tl.progressTrack, { backgroundColor: colors.border }]}>
                  <LinearGradient
                    colors={["#3B82F6", "#1D4ED8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[tl.progressFill, { width: `${step.progressPct}%` }]}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}
const tl = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  iconCol: { alignItems: "center", width: 28 },
  circle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  line: { width: 2, flex: 1, minHeight: 12, marginVertical: 3 },
  content: { flex: 1, paddingBottom: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  label: { fontSize: 14 },
  doneBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  doneBadgeText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  activeBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: "600", color: "#2563EB" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  date: { fontSize: 12 },
  detailBox: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8 },
  detailText: { fontSize: 12, lineHeight: 18 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 12 },
  progressPct: { fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
});

// ─── Main Sheet ───────────────────────────────────────────────────────────────

interface Props {
  campaign: Campaign | null;
  onClose: () => void;
}

export default function CampaignDetailSheet({ campaign, onClose }: Props) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [showMilestones, setShowMilestones] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showContribute, setShowContribute] = useState(false);
  const visible = campaign !== null;

  useEffect(() => {
    if (visible) {
      setShowMilestones(false);
      setShowBudget(false);
      setShowContribute(false);
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

  if (!campaign) return null;

  return (
    <>
      <Modal transparent animationType="none" visible={visible} onRequestClose={close}>
        <Pressable style={s.backdrop} onPress={close} />

        <Animated.View
          style={[
            s.sheet,
            { backgroundColor: colors.background, height: SHEET_HEIGHT, transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle */}
          <View style={s.handleWrap}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <LinearGradient colors={["#7C6FF5", "#5B4FE8"]} style={s.headerIcon}>
              <Ionicons name={campaign.icon as never} size={16} color="#fff" />
            </LinearGradient>
            <View style={[s.activeBadge, { backgroundColor: "#E4FFE9" }]}>
              <Text style={[s.activeBadgeText, { color: "#2D8A44" }]}>Active</Text>
            </View>
            <Pressable style={s.closeBtn} onPress={close} hitSlop={10}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Title + location */}
            <Text style={[s.title, { color: colors.text }]}>{campaign.title}</Text>
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
              <Text style={[s.locationText, { color: colors.mutedForeground }]}>{campaign.location}</Text>
            </View>

            {/* Completion card */}
            <View style={[s.completionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.completionTop}>
                <Text style={[s.completionLabel, { color: colors.mutedForeground }]}>COMPLETION</Text>
                <View style={s.completionRight}>
                  <Text style={[s.completionPct, { color: colors.text }]}>{campaign.completionPct}%</Text>
                  <Pressable
                    onPress={() => { setShowMilestones((m) => !m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <Text style={[s.milestonesToggle, { color: colors.primary }]}>
                      Milestones {showMilestones ? "∧" : ">"}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <View style={[s.progressTrack, { backgroundColor: colors.secondary }]}>
                <LinearGradient
                  colors={["#3B82F6", "#1D4ED8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.progressFill, { width: `${campaign.completionPct}%` }]}
                />
              </View>
              <View style={s.endDateRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
                <Text style={[s.endDateText, { color: colors.mutedForeground }]}>Ends {campaign.endDate}</Text>
              </View>
            </View>

            {/* Project timeline (milestones) */}
            {showMilestones && (
              <View style={s.section}>
                <Text style={[s.sectionLabel, { color: colors.text }]}>PROJECT TIMELINE</Text>
                <View style={{ gap: 0 }}>
                  {TIMELINE.map((step, i) => (
                    <TimelineItem key={step.label} step={step} isLast={i === TIMELINE.length - 1} />
                  ))}
                </View>
              </View>
            )}

            {/* Campaign Budget */}
            <Text style={[s.sectionLabel, { color: colors.text }]}>CAMPAIGN BUDGET</Text>
            <Pressable
              style={[s.calcRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => { setShowBudget((b) => !b); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={s.calcLeft}>
                <Ionicons name="sync-outline" size={14} color={colors.primary} />
                <View>
                  <Text style={[s.calcTitle, { color: colors.text }]}>Calculating...</Text>
                  <Text style={[s.calcSub, { color: colors.mutedForeground }]}>{VENDOR_BIDS.length} vendor bids received</Text>
                </View>
              </View>
              <Ionicons name={showBudget ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
            </Pressable>

            {showBudget && (
              <View style={{ gap: 10 }}>
                {VENDOR_BIDS.map((bid) => (
                  <View key={bid.id} style={[s.vendorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <LinearGradient colors={["#7C6FF5", "#5B4FE8"]} style={s.vendorIcon}>
                      <Ionicons name={bid.icon as never} size={14} color="#fff" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.vendorName, { color: colors.text }]}>{bid.name}</Text>
                      <Text style={[s.vendorEta, { color: colors.mutedForeground }]}>ETA: {bid.etaDays} days</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[s.vendorAmount, { color: "#3B82F6" }]}>{bid.currency}{bid.amount}</Text>
                      <Text style={[s.vendorBidLabel, { color: colors.mutedForeground }]}>bid</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Community */}
            <View style={s.communityRow}>
              <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
              <Text style={[s.communityText, { color: colors.mutedForeground }]}>
                <Text style={{ fontWeight: "700", color: colors.text }}>{campaign.communityCount}</Text> community members joined
              </Text>
            </View>
          </ScrollView>

          {/* Contribute button */}
          <View style={[s.footer, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 12 : 24 }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowContribute(true);
              }}
            >
              <LinearGradient
                colors={["#22C55E", "#16A34A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.contributeBtn}
              >
                <Ionicons name="qr-code-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.contributeBtnText}>Contribute</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>

      {/* Contribute QR overlay */}
      <ContributeModal
        visible={showContribute}
        upiCode={campaign?.upiCode ?? ""}
        onClose={() => setShowContribute(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
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
  header: {
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
  title: { fontSize: 18, fontWeight: "700", lineHeight: 26 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: -4 },
  locationText: { fontSize: 13 },

  completionCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  completionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  completionRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  completionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },
  completionPct: { fontSize: 18, fontWeight: "800" },
  milestonesToggle: { fontSize: 13, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 4 },
  endDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  endDateText: { fontSize: 12 },

  section: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },

  calcRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  calcLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  calcTitle: { fontSize: 14, fontWeight: "600" },
  calcSub: { fontSize: 12 },

  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  vendorIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  vendorName: { fontSize: 14, fontWeight: "600" },
  vendorEta: { fontSize: 12 },
  vendorAmount: { fontSize: 15, fontWeight: "700" },
  vendorBidLabel: { fontSize: 11 },

  communityRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 4 },
  communityText: { fontSize: 13 },

  footer: { borderTopWidth: 1, padding: 16 },
  contributeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 15,
  },
  contributeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
