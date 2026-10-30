// components/NotificationBell.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { getUnreadCount } from "../service/notifications";

export default function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const fetch = async () => {
        const c = await getUnreadCount();
        if (mounted) setUnread(c);
      };
      fetch();
      const interval = setInterval(fetch, 5000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, []),
  );

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={() => router.push("/notifications")}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={26} color="#222" />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 8, marginRight: 8, position: "relative" },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ff4d6d",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});
