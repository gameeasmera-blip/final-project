import "react-native-gesture-handler";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createNotification } from "../service/notifications";

import CardItem from "../components/CardItem";
import Category from "../components/Category";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { globalstyles } from "../styles/globalStyles";

import { account, database } from "../service/appwrite";
import { getItems, removeItem, saveItem } from "../service/storage";

// Appwrite Configuration Constants
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "69f5d7ee002539e83897";
const DATABASE_ID = "69f5df9e0023e090ae30";
const COLLECTION_ID = "property";
const BUCKET_ID = "69f5f4f7003246f224f5";

const getImageUrl = (fileId) => {
  if (!fileId) return null;
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setselectedCategory] = useState("All");
  const [Items, setItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [likedItemIds, setLikedItemIds] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Categories dabalataa: "Image", "Video" dabaluuf
  const categories = ["All", "Villa", "Apartment", "House", "Condo", "Video"];

  // ================= USER SESSION (LOGIN USER) =================
  const [currentUser, setCurrentUser] = useState({
    id: "user_current",
    name: "User",
    avatar: "",
    email: "",
  });

  // ================= COMMENT & MODAL STATES =================
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedItemForComment, setSelectedItemForComment] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentsList, setCommentsList] = useState({});

  useEffect(() => {
    fetchCurrentUser();
    loadItems();
    loadSavedItems();
  }, []);

  // Profile User-a Login godhee retrieval
  const fetchCurrentUser = async () => {
    try {
      const user = await account.get();
      if (user) {
        setCurrentUser({
          id: user.$id,
          name: user.name || user.email.split("@")[0] || "User",
          avatar: user.prefs?.avatar || getImageUrl(user.prefs?.imageId) || "",
          email: user.email,
        });
      }
    } catch (err) {
      console.log("User active session not found:", err);
    }
  };

  const loadItems = async () => {
    setRefreshing(true);
    try {
      const response = await database.listDocuments(DATABASE_ID, COLLECTION_ID);

      const appwriteItems = response.documents.map((doc) => {
        let imageUrls = [];
        if (Array.isArray(doc.imageIds) && doc.imageIds.length > 0) {
          imageUrls = doc.imageIds.map((id) => getImageUrl(id));
        } else if (doc.imageId) {
          imageUrls = [getImageUrl(doc.imageId)];
        }

        const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;

        return {
          id: doc.$id,
          name: doc.name,
          price: doc.price,
          Category: doc.Category,
          description: doc.description || doc.descriptio,
          phone: doc.phone,
          save: false,
          imageUrl: primaryImageUrl,
          imageUrls: imageUrls,
          videoUrl: doc.videoUrl || null,
          videoId: doc.videoId || null,
          mediaType:
            doc.mediaType || (doc.videoUrl || doc.videoId ? "video" : "image"),
          ownerId: doc.ownerId || null,
          ownerName: doc.ownerName || null,
          ownerEmail: doc.ownerEmail || null,
          ownerImage: getImageUrl(doc.ownerImageId) || null,
          commentsCount: doc.commentsCount || 0,
          likesCount: doc.likesCount || 0,
        };
      });

      setItems(appwriteItems);
    } catch (error) {
      console.error("Error loading Items:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadSavedItems = async () => {
    try {
      const items = await getItems();
      setSavedItems(items || []);
    } catch (error) {
      console.error("Error loading saved items:", error);
    }
  };

  // ================= ❤️ LIKE FUNCTION =================
  const handleLikeItem = async (item) => {
    const alreadyLiked = likedItemIds.includes(item.id);

    setLikedItemIds((prev) =>
      alreadyLiked ? prev.filter((id) => id !== item.id) : [...prev, item.id],
    );

    if (!alreadyLiked) {
      await createNotification({
        userId: item.ownerId || "post_owner",
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorAvatar: currentUser.avatar,
        type: "like",
        postId: item.id,
        postName: item.name,
        postImage: item.imageUrl,
        postVideo: item.videoUrl || item.videoId || "",
        mediaType: item.mediaType || "image",
        message: "post kee like godhe ❤️",
      });
    }
  };

  // ================= 💬 COMMENT FUNCTION =================
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedItemForComment) return;

    const itemId = selectedItemForComment.id;
    const text = commentText.trim();

    const newComment = {
      id: Date.now().toString(),
      text,
      user: currentUser.name,
      avatar: currentUser.avatar,
      time: "Just now",
    };

    setCommentsList((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), newComment],
    }));

    await createNotification({
      userId: selectedItemForComment.ownerId || "post_owner",
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorAvatar: currentUser.avatar,
      type: "comment",
      postId: itemId,
      postName: selectedItemForComment.name,
      postImage: selectedItemForComment.imageUrl,
      postVideo:
        selectedItemForComment.videoUrl || selectedItemForComment.videoId || "",
      mediaType: selectedItemForComment.mediaType || "image",
      message: `comment godhe: "${text.slice(0, 40)}"`,
      extra: { commentText: text },
    });

    setCommentText("");
  };

  // ================= 🔗 SHARE FUNCTION =================
  const handleShareItem = async (item) => {
    try {
      const result = await Share.share({
        title: item.name,
        message: `🏠 *${item.name}*\n💰 Gatii: $${item.price}\n📞 Bilbila: ${item.phone}\n\nOdeeffannoo dabalataaf Appii keenya fayyadamaa!`,
      });

      if (result.action === Share.sharedAction) {
        await createNotification({
          userId: item.ownerId || "post_owner",
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorAvatar: currentUser.avatar,
          type: "share",
          postId: item.id,
          postName: item.name,
          postImage: item.imageUrl,
          postVideo: item.videoUrl || item.videoId || "",
          mediaType: item.mediaType || "image",
          message: "post kee share godhe 🔗",
        });
      }
    } catch (error) {
      console.error("Error sharing item:", error.message);
    }
  };

  // ================= 💾 SAVE FUNCTION =================
  const handleSaveItem = async (selectedItem) => {
    const iscurrentlySaved = savedItems.some(
      (item) => item.id === selectedItem.id,
    );

    if (iscurrentlySaved) {
      await removeItem(selectedItem.id);
    } else {
      await saveItem({ ...selectedItem, save: true });

      await createNotification({
        userId: selectedItem.ownerId || "post_owner",
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorAvatar: currentUser.avatar,
        type: "save",
        postId: selectedItem.id,
        postName: selectedItem.name,
        postImage: selectedItem.imageUrl,
        postVideo: selectedItem.videoUrl || selectedItem.videoId || "",
        mediaType: selectedItem.mediaType || "image",
        message: "post kee save godhe 💾",
      });
    }
    await loadSavedItems();
  };

  const handleOpenComment = (item) => {
    setSelectedItemForComment(item);
    setCommentModalVisible(true);
  };

  const itemsWITHSavedStatus = Items.map((item) => ({
    ...item,
    saved: savedItems.some((s) => s.id === item.id),
    isLiked: likedItemIds.includes(item.id),
    commentsCount: (commentsList[item.id] || []).length,
  }));

  // CATEGORY FILTER (Suuraa / Viidiyoo / Category Biros Addaan Baasuu)
  const filteredItems = itemsWITHSavedStatus.filter((item) => {
    if (selectedCategory === "All") return true;
    if (selectedCategory === "Image") return item.mediaType === "image";
    if (selectedCategory === "Video") return item.mediaType === "video";
    return item.Category === selectedCategory;
  });

  const activeComments = selectedItemForComment
    ? commentsList[selectedItemForComment.id] || []
    : [];

  return (
    <View style={globalstyles.containerGrey}>
      {/* Profile Header (Maqaa fi Profile Avatar) */}
      <Header currentUser={currentUser} />

      <View style={globalstyles.categoryContainer}>
        <Category
          categories={categories}
          selectedCategory={selectedCategory}
          onselect={setselectedCategory}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{ width: "100%", paddingHorizontal: 10, marginBottom: 15 }}
          >
            <CardItem
              onPress={(selected) => router.push(`/details/${selected.id}`)}
              item={item}
              onSave={() => handleSaveItem(item)}
              onLike={() => handleLikeItem(item)}
              onComment={() => handleOpenComment(item)}
              onShare={() => handleShareItem(item)}
            />
          </View>
        )}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={loadItems}
      />

      {/* ================= INSTAGRAM BOTTOM SHEET MODAL ================= */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setCommentModalVisible(false)}
          />

          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.dragIndicator} />
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => setCommentModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={activeComments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                  <Text style={{ color: "#777", marginTop: 8 }}>
                    No comments yet. Be the first to comment!
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{item.user}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                  <Text style={styles.commentTime}>{item.time}</Text>
                </View>
              )}
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Text
                  style={{
                    color: commentText.trim() ? "#ff4d6d" : "#ccc",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Post
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justify: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "60%",
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  closeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ff4d6d",
    alignItems: "center",
    justifyContent: "center",
  },
  commentUser: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#333",
  },
  commentText: {
    fontSize: 14,
    color: "#444",
  },
  commentTime: {
    fontSize: 11,
    color: "#999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    color: "#333",
  },
});
