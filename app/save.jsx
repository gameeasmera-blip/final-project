import React, { useState, useEffect } from "react";
import { getItems, removeItem } from "../service/storage";
import {
  Alert,
  Text,
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { globalstyles } from "../styles/globalStyles";
import MiniCards from "../components/MiniCards";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";

// Appwrite Storage Constants
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "69f5d7ee002539e83897";
const BUCKET_ID = "69f5f4f7003246f224f5";

// Direct Image URL Generator
const formatImageUrl = (item) => {
  if (!item) return null;

  // 1. Yoo duraan URL guutuu `http` qabaate sana fayyadama
  if (typeof item.imageUrl === "string" && item.imageUrl.startsWith("http")) {
    return item.imageUrl;
  }

  // 2. Yoo Image ID qabaate Appwrite Storage URL uuma
  const fileId =
    item.imageId ||
    (Array.isArray(item.imageIds) && item.imageIds.length > 0
      ? item.imageIds[0]
      : null);

  if (fileId) {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
  }

  return null;
};

export default function SavedScreen() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const savedItems = await getItems();

      // Item tokko tokkoof Image URL sirreessuu
      const formattedItems = (savedItems || []).map((item) => ({
        ...item,
        imageUrl: formatImageUrl(item),
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error("Error loading saved items:", error);
    }
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert("Delete Item", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await removeItem(itemId);
            loadSavedItems();
          } catch (error) {
            console.error("Error deleting item:", error);
          }
        },
      },
    ]);
  };

  const handleArchiveItem = (itemId) => {
    Alert.alert("Archive Item", "Wanta kana archive gochuu ni barbaaddaa?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            setItems((prevItems) =>
              prevItems.filter((item) => item.id !== itemId),
            );
            await removeItem(itemId);
          } catch (error) {
            console.error("Error archiving item:", error);
            loadSavedItems();
          }
        },
      },
    ]);
  };

  const renderRightActions = (id, progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-150, -80, 0],
      outputRange: [1, 1, 0.4],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(id)}
      >
        <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={26} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (id, progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80, 150],
      outputRange: [0.4, 1, 1],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.archiveButton}
        onPress={() => handleArchiveItem(id)}
      >
        <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
          <Ionicons name="archive-outline" size={26} color="white" />
          <Text style={styles.actionText}>Archive</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderEmptyContainer = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={80} color="#be8e8e" />
      <Text style={styles.emptyText}>Folder is empty</Text>
      <Text style={styles.emptySubText}>
        No items have been saved yet. Start exploring and save your favorite
        products to see them here!
      </Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[
          globalstyles.containerGrey,
          { flex: 1, backgroundColor: "#f5f5f5" },
        ]}
      >
        {items.length > 0 && (
          <Text style={styles.itemCountText}>
            {items.length} {items.length <= 1 ? "item" : "items"} saved
          </Text>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyContainer}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <Swipeable
                renderRightActions={(progress, dragX) =>
                  renderRightActions(item.id, progress, dragX)
                }
                renderLeftActions={(progress, dragX) =>
                  renderLeftActions(item.id, progress, dragX)
                }
                friction={1.2}
                overshootRight={false}
                overshootLeft={false}
              >
                <View style={styles.cardContent}>
                  <MiniCards item={item} />
                </View>
              </Swipeable>
            </View>
          )}
          style={{ paddingHorizontal: 14 }}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: "#fff",
    marginVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  cardContent: {
    backgroundColor: "white",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "100%",
  },
  archiveButton: {
    backgroundColor: "#007aff",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    height: "100%",
  },
  actionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 11,
    marginTop: 2,
  },
  itemCountText: {
    textAlign: "center",
    marginTop: 50,
    marginBottom: 15,
    fontSize: 18,
    fontWeight: "600",
    color: "#5629f9",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginTop: 15,
  },
  emptySubText: {
    color: "#555",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
});
