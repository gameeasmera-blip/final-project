import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "react-native-paper";
import { useRouter } from "expo-router";

// 🔴 1. IMPORT APPWRITE FUNCTION
import { getImageUrl } from "../service/appwrite";

const { width } = Dimensions.get("window");

export default function CardItem({
  item,
  user: userProp,
  onPress,
  onSave,
  onLike,
  onComment,
  onShare,
  onProfile,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  console.log("ITEM DATA:", item);
  console.log("ITEM USER:", item?.user);

  // 🔴 2. SUURAALEE POSTII APPWRITE IRRAA SIRREESSUU
  const rawImages = item.imageUrls || (item.imageUrl ? [item.imageUrl] : []);

  const images = rawImages.map((img) => {
    if (!img)
      return "https://via.placeholder.com/350x350/e1e1e1/808080?text=No+Image";

    if (
      typeof img === "string" &&
      (img.startsWith("http://") || img.startsWith("https://"))
    ) {
      return img;
    }

    if (typeof getImageUrl === "function") {
      return getImageUrl(img);
    }

    return img;
  });

  const imageCount = images.length;
  const currentImage = images[activeIndex] || images[0];

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 🔴 3. USER DATA & PROFILE IMAGE URI
  const user = userProp ||
    item?.user || {
      name:
        item?.userName || item?.ownerName || item?.actorName || "Maqaa Barataa",
      imageUrl:
        item?.userImage ||
        item?.profilePic ||
        item?.actorAvatar ||
        item?.avatar ||
        null,
      email: item?.userEmail || item?.email || null,
      prefs: item?.prefs || null,
    };

  // 🔍 2. USER ISA WALSIMATE ARGUUF KANAS GALCHUU DANDEESSA
  console.log("FINAL USER RESOLVED:", user);

  const profileImageUri =
    user?.imageUrl ||
    user?.avatar ||
    user?.prefs?.avatar ||
    (user?.prefs?.imageId && typeof getImageUrl === "function"
      ? getImageUrl(user.prefs.imageId)
      : null);

  return (
    <View style={styles.cardContainer}>
      {/* ================= USER PROFILE HEADER ================= */}
      <TouchableOpacity
        style={styles.headerContainer}
        activeOpacity={0.7}
        onPress={() => router.push("/profile")}
      >
        {profileImageUri ? (
          <Avatar.Image
            size={45}
            source={{ uri: profileImageUri }}
            backgroundColor="#e1e1e1"
          />
        ) : (
          <Avatar.Text size={42} label={getInitials(user?.name)} />
        )}

        <View style={styles.textContainer}>
          <Text style={styles.userName}>{user?.name || "Maqaa Barataa"}</Text>
          {user?.email && <Text style={styles.userSubText}>{user.email}</Text>}
        </View>
      </TouchableOpacity>

      {/* ================= INSTAGRAM CAROUSEL (NOW TOUCHABLE) ================= */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => onPress && onPress(item)}
        style={{ position: "relative" }}
      >
        <FlatList
          data={
            images.length > 0
              ? images
              : [
                  "https://via.placeholder.com/350x350/e1e1e1/808080?text=No+Image",
                ]
          }
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(img, index) => index.toString()}
          renderItem={({ item: imgUrl }) => (
            <Image
              style={{
                width: width - 20,
                height: 350,
                resizeMode: "cover",
                backgroundColor: "#f1f2f6",
              }}
              source={{ uri: imgUrl }}
            />
          )}
        />
        {images.length > 1 && (
          <View style={styles.imageBadge}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ================= ACTION BUTTONS ================= */}
      <View style={styles.actionRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity
            onPress={onLike}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={item.isLiked ? "#ff4d6d" : "#2d3436"}
            />
            {(item.likesCount > 0 || item.isLiked) && (
              <Text style={styles.actionText}>
                {item.likesCount
                  ? item.likesCount + (item.isLiked ? 1 : 0)
                  : item.isLiked
                    ? 1
                    : 0}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onComment}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#2d3436" />
            {item.commentsCount > 0 && (
              <Text style={styles.actionText}>{item.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={{ padding: 2 }}>
            <Ionicons name="paper-plane-outline" size={22} color="#2d3436" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onSave} style={{ padding: 2 }}>
          <Ionicons
            name={item.saved ? "bookmark" : "bookmark-outline"}
            size={24}
            color={item.saved ? "#ff4d6d" : "#2d3436"}
          />
        </TouchableOpacity>
      </View>

      {/* ================= INFO ================= */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress && onPress(item)}
        style={styles.infoContainer}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.name || item.title || "Property"}
          </Text>
          <Text style={styles.propertyPrice}>${item.price}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  textContainer: { justifyContent: "center" },
  userName: { fontSize: 15, fontWeight: "bold", color: "#2d3436" },
  userSubText: { fontSize: 12, color: "#636e72" },
  imageBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(51, 49, 49, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionText: { fontSize: 14, fontWeight: "600", color: "#2d3436" },
  infoContainer: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    paddingTop: 4,
  },
  propertyTitle: { fontSize: 16, fontWeight: "bold", color: "#2d3436" },
  propertyPrice: { fontSize: 15, fontWeight: "700", color: "#ff4d6d" },
});
