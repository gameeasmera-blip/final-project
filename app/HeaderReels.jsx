import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HeaderReels({ items = [], onSelectReel }) {
  // 1. Filter Sirreeffame: Video check sirrii gochuu
  const videoItems = (Array.isArray(items) ? items : []).filter((item) => {
    if (!item) return false;

    // Check 1: mediaType-n 'video' ta'uu
    const isVideoType = item.mediaType === "video";

    // Check 2: videoUrl qabaachuu (Null, undefined, fi empty string checks)
    const hasVideoUrl =
      item.videoUrl &&
      typeof item.videoUrl === "string" &&
      item.videoUrl.trim() !== "";

    // Check 3: videoId qabaachuu
    const hasVideoId =
      item.videoId &&
      typeof item.videoId === "string" &&
      item.videoId.trim() !== "";

    return isVideoType || hasVideoUrl || hasVideoId;
  });

  // Yoo viidiyoon tokkollee hin jiree Komponentiin kun hin mul'atu
  if (videoItems.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Title / Subtitle Header Reel */}
      <View style={styles.headerTitleRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="videocam" size={20} color="#ff4d6d" />
          <Text style={styles.headerTitle}>Property Reels</Text>
        </View>
        <Text style={styles.videoCount}>{videoItems.length} Videos</Text>
      </View>

      {/* Horizontal Scroll Bar - Reel Thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10, gap: 12 }}
      >
        {videoItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.reelCard}
            onPress={() => onSelectReel && onSelectReel(item)}
          >
            {/* Thumbnail Image */}
            <Image
              source={{
                uri:
                  item.imageUrl ||
                  item.ownerImage ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.thumbnail}
            />

            {/* Dark Overlay with Play Icon */}
            <View style={styles.overlay}>
              <View style={styles.playBadge}>
                <Ionicons name="play" size={16} color="white" />
              </View>
            </View>

            {/* Reel Badge Title */}
            <Text numberOfLines={1} style={styles.reelName}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 15,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  videoCount: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
  },
  reelCard: {
    width: 90,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#222",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  playBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 77, 109, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 2,
  },
  reelName: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
