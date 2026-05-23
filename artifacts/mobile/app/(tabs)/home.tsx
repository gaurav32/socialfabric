import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { useColors } from "@/hooks/useColors";

interface Post {
  id: string;
  title: string;
  body: string;
  category: string;
  author: string;
  createdAt: number;
}

const CATEGORIES = ["All", "Climate", "Mental Health", "Inequality", "Education"];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const data: Post[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));
      setPosts(data);
    } catch {
      // Firestore might be empty / rules not set — show empty state
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logout();
    router.replace("/");
  };

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Changemaker";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.heroGradientStart, colors.background]}
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            paddingBottom: 16,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
            <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
          </View>
          <Pressable onPress={handleLogout}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logoutBtn, { borderRadius: colors.radius }]}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[{ v: "43", l: "Cities" }, { v: "8", l: "Movements" }, { v: "120k", l: "Members" }].map((s) => (
            <View key={s.l} style={[styles.statChip, { backgroundColor: colors.statBg, borderRadius: 20 }]}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{s.v}</Text>
              <Text style={[styles.statLbl, { color: colors.statText }]}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Category filter */}
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setActiveCategory(item); Haptics.selectionAsync(); }}
              style={[
                styles.catChip,
                {
                  backgroundColor: activeCategory === item ? colors.primary : colors.secondary,
                  borderRadius: 20,
                },
              ]}
            >
              <Text style={[styles.catChipText, { color: activeCategory === item ? "#fff" : colors.mutedForeground }]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </LinearGradient>

      {/* Feed */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.feed, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          scrollEnabled={!!filtered.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="globe-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Be the first to share something that matters.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.postCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
                <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{item.category}</Text>
              </View>
              <Text style={[styles.postTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.postBody, { color: colors.mutedForeground }]} numberOfLines={3}>{item.body}</Text>
              <View style={styles.postFooter}>
                <Ionicons name="person-circle-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.postAuthor, { color: colors.mutedForeground }]}>{item.author}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  displayName: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  logoutBtn: { padding: 10 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  statChip: { paddingHorizontal: 14, paddingVertical: 6, alignItems: "center" },
  statVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  catList: { paddingBottom: 4, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8 },
  catChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  feed: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
  postCard: { padding: 18, borderWidth: 1 },
  categoryBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  categoryBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  postTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 6 },
  postBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 12 },
  postFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  postAuthor: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
