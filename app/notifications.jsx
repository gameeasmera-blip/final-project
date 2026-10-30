// app/notifications.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../service/notifications";

const TYPE_ICON = {
  like: { name: "heart", color: "#ef4444", label: "❤️" },
  comment: { name: "chatbubble", color: "#3b82f6", label: "💬" },
  share: { name: "share-social", color: "#10b981", label: "🔗" },
  save: { name: "bookmark", color: "#f59e0b", label: "💾" },
  message: { name: "mail", color: "#8b5cf6", label: "✉️" },
  view: { name: "eye", color: "#06b6d4", label: "👁️" },
  react: { name: "happy", color: "#ec4899", label: "😀" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const list = await getNotifications();
    setNotifs(list);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const handlePress = async (notif) => {
    if (!notif.isRead) await markAsRead(notif.$id);
    await load();

    // Post detail-itti geessi
    if (notif.postId && notif.type !== "message") {
      router.push(`/details/${notif.postId}`);
    }
    // Yoo message ta'e, chat-itti geessi
    if (notif.type === "message") {
      router.push(`/chat/${notif.actorId}`);
    }
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    await load();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    await load();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    await load();
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  const timeAgo = (iso) => {
    if (!iso) return "";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* ============ HEADER ============ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {notifs.length > 0 && (
          <TouchableOpacity onPress={handleMarkAll} style={styles.headerBtn}>
            <Ionicons name="checkmark-done" size={22} color="#ff4d6d" />
          </TouchableOpacity>
        )}
        {notifs.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={22} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* ============ LIST ============ */}
      <FlatList
        data={notifs}
        keyExtractor={(item) => item.$id}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Notification hin jiru</Text>
            <Text style={styles.emptySub}>
              Yeroo namni post kee like, comment, share ykn save godhu asitti
              mul'ata
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const icon = TYPE_ICON[item.type] || {
            name: "notifications",
            color: "#666",
          };
          return (
            <TouchableOpacity
              style={[styles.item, !item.isRead && styles.itemUnread]}
              onPress={() => handlePress(item)}
              onLongPress={() => handleDelete(item.$id)}
              activeOpacity={0.7}
            >
              {/* Avatar / Icon */}
              <View style={styles.avatarWrapper}>
                {item.actorAvatar ? (
                  <Image
                    source={{ uri: item.actorAvatar }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${icon.color}20` },
                    ]}
                  >
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                )}

                {/* Type badge (small circle) */}
                <View
                  style={[styles.typeBadge, { backgroundColor: icon.color }]}
                >
                  <Ionicons name={icon.name} size={9} color="#fff" />
                </View>
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemText}>
                  <Text style={styles.itemActor}>
                    {item.actorName || "User"}
                  </Text>{" "}
                  {item.message}
                </Text>

                {item.postName ? (
                  <Text style={styles.itemPost} numberOfLines={1}>
                    🏠 {item.postName}
                  </Text>
                ) : null}

                <Text style={styles.itemTime}>{timeAgo(item.$createdAt)}</Text>
              </View>

              {/* Post Thumbnail */}
              {item.postImage ? (
                <Image
                  source={{ uri: item.postImage }}
                  style={styles.postThumb}
                />
              ) : null}

              {/* Unread dot */}
              {!item.isRead && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  backBtn: { marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#222" },
  headerSub: { fontSize: 12, color: "#ff4d6d", marginTop: 2 },
  headerBtn: { padding: 8 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    position: "relative",
  },
  itemUnread: { backgroundColor: "#fff5f7" },

  avatarWrapper: { position: "relative" },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  itemText: { fontSize: 14, color: "#333", lineHeight: 19 },
  itemActor: { fontWeight: "bold", color: "#111" },
  itemPost: { fontSize: 12, color: "#666", marginTop: 2 },
  itemTime: { fontSize: 11, color: "#999", marginTop: 3 },

  postThumb: { width: 44, height: 44, borderRadius: 6 },

  dot: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ff4d6d",
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: "#999",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
});
