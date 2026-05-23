import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

const REFERRAL_CODE = "FABRIC-ADI2025";
const APP_DEEP_LINK_BASE = "socialfabric://task";

type TaskStatus = "active" | "accepted" | "completed" | "failed";
type TaskType = "recommendation" | "bid" | "survey";

interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  location: string;
  dueDate: string;
  coins: number;
  icon: string;
  iconGradient: readonly [string, string];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Recommend a Barber near Dwarka Sec 21",
    type: "recommendation",
    status: "active",
    location: "Dwarka Sec 21, New Delhi",
    dueDate: "Jun 10, 2025",
    coins: 80,
    icon: "cut-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "2",
    title: "Submit Bid — Cycle Service Booking",
    type: "bid",
    status: "active",
    location: "Dwarka Sec 21, New Delhi",
    dueDate: "Jun 15, 2025",
    coins: 120,
    icon: "bicycle-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "3",
    title: "Recommend a Bike Mechanic — Royal Enfield",
    type: "recommendation",
    status: "active",
    location: "Dwarka, New Delhi",
    dueDate: "Jun 12, 2025",
    coins: 95,
    icon: "construct-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "4",
    title: "Find a Plumber in Rohini",
    type: "recommendation",
    status: "accepted",
    location: "Rohini, New Delhi",
    dueDate: "Jun 8, 2025",
    coins: 60,
    icon: "hammer-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "5",
    title: "Submit Bid — AC Repair",
    type: "bid",
    status: "accepted",
    location: "Janakpuri, New Delhi",
    dueDate: "Jun 9, 2025",
    coins: 150,
    icon: "snow-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "6",
    title: "Recommend a Dentist near Sector 10",
    type: "recommendation",
    status: "completed",
    location: "Dwarka Sec 10, New Delhi",
    dueDate: "May 30, 2025",
    coins: 70,
    icon: "medkit-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "7",
    title: "Community Survey — Local Markets",
    type: "survey",
    status: "completed",
    location: "Dwarka, New Delhi",
    dueDate: "May 28, 2025",
    coins: 40,
    icon: "document-text-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
  {
    id: "8",
    title: "Find Yoga Instructor in Palam",
    type: "recommendation",
    status: "failed",
    location: "Palam, New Delhi",
    dueDate: "May 25, 2025",
    coins: 55,
    icon: "body-outline",
    iconGradient: ["#7C6FF5", "#5B4FE8"],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: TaskStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
];

const CATEGORY_COLORS: Record<TaskType, { bg: string; text: string }> = {
  recommendation: { bg: "#EEF0FF", text: "#5B4FE8" },
  bid: { bg: "#E8F0FF", text: "#3461E8" },
  survey: { bg: "#FFF4E0", text: "#B86A00" },
};

const CATEGORY_LABELS: Record<TaskType, string> = {
  recommendation: "Recommendation",
  bid: "Bid",
  survey: "Survey",
};

// ─── Gradient Icon ────────────────────────────────────────────────────────────

function GradientIcon({
  name,
  gradient,
  size = 44,
  iconSize = 20,
}: {
  name: string;
  gradient: readonly [string, string];
  size?: number;
  iconSize?: number;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientIcon, { width: size, height: size, borderRadius: size * 0.28 }]}
    >
      <Ionicons name={name as never} size={iconSize} color="#fff" />
    </LinearGradient>
  );
}

// ─── Coin Badge ───────────────────────────────────────────────────────────────

function CoinBadge({ amount }: { amount: number }) {
  return (
    <LinearGradient
      colors={["#FFD700", "#F59E0B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.coinBadge}
    >
      <Ionicons name="star" size={11} color="#fff" style={{ marginRight: 3 }} />
      <Text style={styles.coinBadgeText}>+{amount}</Text>
    </LinearGradient>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onAccept,
  onReject,
  onWhatsApp,
}: {
  task: Task;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onWhatsApp: (id: string) => void;
}) {
  const colors = useColors();
  const [bidAmount, setBidAmount] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  const catColor = CATEGORY_COLORS[task.type];
  const isActive = task.status === "active";
  const isAccepted = task.status === "accepted";
  const isCompleted = task.status === "completed";
  const isFailed = task.status === "failed";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isFailed ? 0.65 : 1,
        },
      ]}
    >
      {/* Top row: icon + title + bookmark */}
      <View style={styles.cardTop}>
        <GradientIcon name={task.icon} gradient={task.iconGradient} />
        <View style={styles.taskTitleWrap}>
          <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryText, { color: catColor.text }]}>
              {CATEGORY_LABELS[task.type]}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setBookmarked((b) => !b);
          }}
          hitSlop={8}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={18}
            color={bookmarked ? colors.primary : colors.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Meta + coins row */}
      <View style={styles.metaCoinsRow}>
        <View style={styles.metaCol}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{task.location}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Due {task.dueDate}</Text>
          </View>
        </View>
        <CoinBadge amount={task.coins} />
      </View>

      {/* Action row — only for active / accepted */}
      {(isActive || isAccepted) && (
        <View style={styles.actionRow}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptBtnGradient}
          >
            <Pressable
              style={styles.acceptBtnInner}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onAccept(task.id);
              }}
            >
              <Ionicons name="checkmark-circle" size={15} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.acceptBtnText}>Accept Task</Text>
            </Pressable>
          </LinearGradient>

          {task.type === "recommendation" && (
            <Pressable
              style={styles.whatsappBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onWhatsApp(task.id);
              }}
            >
              <LinearGradient
                colors={["#25D366", "#128C7E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.whatsappGradient}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          )}

          {task.type === "bid" && (
            <View style={[styles.bidInput, { borderColor: colors.border, backgroundColor: colors.input }]}>
              <Ionicons name="cash-outline" size={13} color={colors.mutedForeground} style={{ marginRight: 4 }} />
              <TextInput
                style={[styles.bidInputText, { color: colors.text }]}
                placeholder="Amount"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
              />
            </View>
          )}

          <Pressable
            style={[styles.rejectBtn, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onReject(task.id);
            }}
          >
            <Ionicons name="thumbs-down-outline" size={16} color="#EF4444" />
          </Pressable>
        </View>
      )}

      {/* Status pill for completed / failed */}
      {(isCompleted || isFailed) && (
        <View style={[
          styles.statusPill,
          { backgroundColor: isCompleted ? "#E4FFE9" : "#FFE4E4" },
        ]}>
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "close-circle"}
            size={13}
            color={isCompleted ? "#2D8A44" : "#EF4444"}
            style={{ marginRight: 4 }}
          />
          <Text style={{ color: isCompleted ? "#2D8A44" : "#EF4444", fontSize: 12, fontWeight: "600" }}>
            {isCompleted ? "Completed" : "Failed"}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TaskStatus>("active");
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

  const displayName = user?.displayName ?? "Dev User";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  const countByStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  const filtered = tasks.filter((t) => t.status === activeTab);

  const handleAccept = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "accepted" as TaskStatus } : t)));

  const handleReject = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "failed" as TaskStatus } : t)));

  const handleWhatsApp = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const task = tasks.find((t) => t.id === id);
    const taskTitle = task?.title ?? "a task";
    const deepLink = `${APP_DEEP_LINK_BASE}/${id}?ref=${REFERRAL_CODE}&taskCode=${id}`;
    const message =
      `Hey! I found something on Social Fabric 🧵\n\n` +
      `*${taskTitle}*\n` +
      `📍 ${task?.location ?? ""}\n\n` +
      `Join using my referral code *${REFERRAL_CODE}* and open this task directly:\n` +
      `${deepLink}\n\n` +
      `Download the app: https://socialfabric.app`;
    const encoded = encodeURIComponent(message);
    const waUrl = Platform.OS === "web"
      ? `https://web.whatsapp.com/send?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    Linking.openURL(waUrl);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.heroGradientStart, colors.background]}
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16 },
        ]}
      >
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
        <Text style={[styles.displayName, { color: colors.text }]}>{displayName} 👋</Text>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((tab) => {
            const count = countByStatus(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.tabLabel, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[
                    styles.tabCount,
                    { backgroundColor: isActive ? "rgba(255,255,255,0.25)" : colors.secondary },
                  ]}>
                    <Text style={[styles.tabCountText, { color: isActive ? "#fff" : colors.primary }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* ── Task list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onAccept={handleAccept}
            onReject={handleReject}
            onWhatsApp={handleWhatsApp}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient colors={["#E8E6FF", "#C8C3FF"]} style={styles.emptyIconWrap}>
              <Ionicons name="checkbox-outline" size={32} color="#5B4FE8" />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No {activeTab} tasks
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 16 },
  greeting: { fontSize: 13, marginBottom: 2 },
  displayName: { fontSize: 22, fontWeight: "700", marginBottom: 14 },

  tabsRow: { flexDirection: "row", gap: 8, paddingRight: 16 },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  tabLabel: { fontSize: 13, fontWeight: "500" },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabCountText: { fontSize: 11, fontWeight: "700" },

  listContent: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },

  // Gradient icon
  gradientIcon: { alignItems: "center", justifyContent: "center" },

  // Coin badge
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  coinBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Task card
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  taskTitleWrap: { flex: 1, gap: 5 },
  taskTitle: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 11, fontWeight: "600" },

  metaCoinsRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  metaCol: { gap: 4, flex: 1, marginRight: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  acceptBtnGradient: { borderRadius: 10 },
  acceptBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  acceptBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  whatsappBtn: { borderRadius: 10, overflow: "hidden" },
  whatsappGradient: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  bidInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 90,
  },
  bidInputText: { flex: 1, fontSize: 13 },

  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  emptyState: { alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 60 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16 },
});
