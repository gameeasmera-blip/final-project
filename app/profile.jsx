import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { useAuth } from "../context/authProvider";
import { account, database, storage } from "../service/appwrite";
import { globalstyles } from "../styles/globalStyles";

const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const DATABASE_ID = "69f5df9e0023e090ae30";
const COLLECTION_ID = "property";
const PROJECT_ID = "69f5d7ee002539e83897";
const PROFILE_BUCKET_ID = "69f5f4f7003246f224f5";

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/60/cccccc/666666?text=No+Image";

const getImageUrl = (bucketId, fileId) => {
  if (!fileId || !bucketId) return null;
  return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${PROJECT_ID}`;
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Property Editing State (Name, Price & Image)
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [newName, setNewName] = useState("");
  const [updatingProperty, setUpdatingProperty] = useState(false);

  const [bio, setBio] = useState(user?.prefs?.bio || "");
  const [phone, setPhone] = useState(user?.prefs?.phone || "+251");
  const [username, setUsername] = useState(
    user?.prefs?.username ||
      `@${user?.name?.toLowerCase().replace(/\s+/g, "")}`,
  );

  const [profileImage, setProfileImage] = useState(
    user?.prefs?.profileImage || null,
  );

  useEffect(() => {
    if (user?.prefs) {
      if (user.prefs.bio) setBio(user.prefs.bio);
      if (user.prefs.phone) setPhone(user.prefs.phone);
      if (user.prefs.username) setUsername(user.prefs.username);
      if (user.prefs.profileImage) setProfileImage(user.prefs.profileImage);
    }
  }, [user]);

  const fetchUserProperties = async () => {
    try {
      if (!user?.email) return;

      const res = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("email", user.email),
      ]);

      const docs = res.documents.map((doc) => {
        const activeImageId = doc.imageId || (doc.imageIds && doc.imageIds[0]);

        let imageUrl = null;
        if (activeImageId) {
          try {
            imageUrl = getImageUrl(PROFILE_BUCKET_ID, activeImageId);
          } catch (err) {
            console.log("Error generating image URL:", err);
          }
        }

        return {
          ...doc,
          imageUrl: imageUrl,
        };
      });

      setProducts(docs);
    } catch (error) {
      setProducts([]);
      console.log("Error loading documents: ", error.message);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchUserProperties();
    }
  }, [user?.email]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserProperties();
    setRefreshing(false);
  }, [user?.email]);

  // Open Edit Modal for Title & Price
  const handleOpenEditModal = (item) => {
    setSelectedProperty(item);
    setNewName(item.name || "");
    setNewPrice(item.price ? String(item.price) : "");
    setEditModalVisible(true);
  };

  // Save Property Updates (Name & Price)
  const handleSavePropertyDetails = async () => {
    if (!selectedProperty) return;
    setUpdatingProperty(true);

    try {
      await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        selectedProperty.$id,
        {
          name: newName,
          price: newPrice,
        },
      );

      // Local state update
      setProducts((prev) =>
        prev.map((p) =>
          p.$id === selectedProperty.$id
            ? { ...p, name: newName, price: newPrice }
            : p,
        ),
      );

      Alert.alert(
        "Milkaa'ina",
        "Odeeffannoon property milkaa'inaan jijjiirameera!",
      );
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error Update", error.message);
    } finally {
      setUpdatingProperty(false);
    }
  };

  // Delete Property Handler
  const handleDeleteProperty = (item) => {
    Alert.alert(
      "Property Haqaa",
      `Nageenyaan "${item.name || "Property"}" haqamuu mirkaneessitaa?`,
      [
        { text: "Dhiisi", style: "cancel" },
        {
          text: "Haqi (Delete)",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete document from Appwrite Database
              await database.deleteDocument(
                DATABASE_ID,
                COLLECTION_ID,
                item.$id,
              );

              // Clean up image file in storage if available
              if (item.imageId) {
                try {
                  await storage.deleteFile(PROFILE_BUCKET_ID, item.imageId);
                } catch (imgErr) {
                  console.log("Storage cleanup notice:", imgErr.message);
                }
              }

              // Update local state
              setProducts((prev) => prev.filter((p) => p.$id !== item.$id));
              Alert.alert("Milkaa'ina", "Property milkaa'inaan haqameera!");
            } catch (error) {
              Alert.alert("Error Delete", error.message);
            }
          },
        },
      ],
    );
  };

  // Handle Editing Image for Property
  const handleEditPropertyImage = (item) => {
    setSelectedProperty(item);
    Alert.alert(
      "Suuraa Property Jijjiiri",
      "Fakkii haaraa eessaa galchuu barbaadda?",
      [
        {
          text: "Kaameraa Saaqi",
          onPress: () => openPropertyCamera(item),
        },
        {
          text: "Gallery Keessaa Filadhu",
          onPress: () => openPropertyGallery(item),
        },
        { text: "Dhiisi (Cancel)", style: "cancel" },
      ],
    );
  };

  const uploadPropertyImage = async (propertyItem, imageUri) => {
    try {
      setUpdatingProperty(true);
      const uriParts = imageUri.split(".");
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "heic", "webp"];
      const ext = validExtensions.includes(fileExtension)
        ? fileExtension
        : "jpg";

      const fileName = `prop_${Date.now()}.${ext}`;
      const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;

      const fileForUpload = {
        name: fileName,
        type: mimeType,
        size: 1000,
        uri: imageUri,
      };

      const uploadedFile = await storage.createFile(
        PROFILE_BUCKET_ID,
        ID.unique(),
        fileForUpload,
      );

      if (!uploadedFile || !uploadedFile.$id) {
        throw new Error("Fakkiin ol-fe'amuu hin dandeenye.");
      }

      const uploadedImageUrl = getImageUrl(PROFILE_BUCKET_ID, uploadedFile.$id);

      await database.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        propertyItem.$id,
        { imageId: uploadedFile.$id },
      );

      setProducts((prev) =>
        prev.map((p) =>
          p.$id === propertyItem.$id
            ? { ...p, imageId: uploadedFile.$id, imageUrl: uploadedImageUrl }
            : p,
        ),
      );

      Alert.alert("Milkaa'ina", "Fakkiin property keessan jijjiirameera!");
    } catch (error) {
      Alert.alert("Error Upload Image", error.message);
    } finally {
      setUpdatingProperty(false);
    }
  };

  const openPropertyCamera = async (item) => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Hayyama",
          "Appiin kaameraa tajaajiluuf hayyama qabaachuu qaba!",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled) {
        await uploadPropertyImage(item, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error Camera:", error.message);
    }
  };

  const openPropertyGallery = async (item) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Hayyama", "Gallery saaquuf hayyamni kun barbaachisaadha!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled) {
        await uploadPropertyImage(item, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error Gallery:", error.message);
    }
  };

  const uploadAndSaveProfileImage = async (imageUri) => {
    try {
      setUploading(true);
      const uriParts = imageUri.split(".");
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      const validExtensions = ["jpg", "jpeg", "png", "heic", "webp"];
      const ext = validExtensions.includes(fileExtension)
        ? fileExtension
        : "jpg";

      const fileName = `profile_${Date.now()}.${ext}`;
      const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;

      const fileForUpload = {
        name: fileName,
        type: mimeType,
        size: 1000,
        uri: imageUri,
      };

      const uploadedFile = await storage.createFile(
        PROFILE_BUCKET_ID,
        ID.unique(),
        fileForUpload,
      );

      if (!uploadedFile || !uploadedFile.$id) {
        throw new Error("Fakkiin ol-fe'amuu hin dandeenye.");
      }

      const uploadedImageUrl = getImageUrl(PROFILE_BUCKET_ID, uploadedFile.$id);

      setProfileImage(uploadedImageUrl);

      await account.updatePrefs({
        ...user?.prefs,
        profileImage: uploadedImageUrl,
        bio: bio,
        phone: phone,
        username: username,
      });

      Alert.alert(
        "Milkaa'ina",
        "Fakkii profile keessan milkaa'inaan jijjiirameera!",
      );
    } catch (error) {
      console.log("Error uploading profile image:", error);
      Alert.alert("Error Uploading", error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsEditing(false);
    setSaving(true);

    try {
      await account.updatePrefs({
        ...user?.prefs,
        bio: bio,
        phone: phone,
        username: username,
        profileImage: profileImage,
      });

      Alert.alert("Milkaa'ina", "Odeeffannoon kee milkaa'inaan kuufameera!");
    } catch (error) {
      console.log("Save Profile Error:", error);
      Alert.alert("Error Save:", error.message);
      setIsEditing(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setSettingsModalVisible(false);
    Alert.alert("Log Out", "Akkaawuntii kee irraa ba'uu barbaaddaa?", [
      { text: "Dhiisi", style: "cancel" },
      {
        text: "Ba'i (Log Out)",
        style: "destructive",
        onPress: async () => {
          try {
            if (logout) {
              await logout();
            }
          } catch (err) {
            Alert.alert("Error Logout", err.message);
          }
        },
      },
    ]);
  };

  const handleAddAccount = () => {
    Alert.alert(
      "Akkaawuntii Haaraa Dabali",
      "Akkaawuntii haaraa galchuuf profile ammee irraa ba'uun gara fuula Loginnitti si geessa. Itti fufuudhaaf mirkanaa'aadootaa?",
      [
        { text: "Dhiisi", style: "cancel" },
        {
          text: "Itti Fufi",
          onPress: async () => {
            try {
              if (logout) {
                await logout();
              }
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const handleSetPhoto = () => {
    Alert.alert(
      "Fakkii Profile Jijjiiri",
      "Fakkii kee eessaa fudhachuu barbaadda?",
      [
        { text: "Kaameraa Saaqi", onPress: openCamera },
        { text: "Gallery Keessaa Filadhu", onPress: openGallery },
        { text: "Haqi (Cancel)", style: "cancel" },
      ],
    );
  };

  const openCamera = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Hayyama Kaameraa",
          "Appiin kun kaameraa kee tajaajiluuf hayyama qabaachuu qaba!",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await uploadAndSaveProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error Camera:", error.message);
    }
  };

  const openGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Hayyama Gallery",
          "Appiin kun kuusaa fakkii kee saaquuf hayyama qabaachuu qaba!",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        await uploadAndSaveProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error Gallery:", error.message);
    }
  };

  const formattedDate = user?.$createdAt
    ? new Date(user.$createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "May 30, 2026";

  const getImageSource = (imageUrl) => {
    const normalizedUrl =
      typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;

    if (normalizedUrl && normalizedUrl.startsWith("http")) {
      return { uri: normalizedUrl };
    }

    return { uri: PLACEHOLDER_IMAGE };
  };

  const renderHeader = () => (
    <View>
      <View style={{ height: 20 }} />

      {/* Profile Card Main */}
      <View style={globalstyles.profileMain}>
        <TouchableOpacity
          onPress={() => setSettingsModalVisible(true)}
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            padding: 8,
            backgroundColor: "#f1f2f6",
            borderRadius: 20,
            zIndex: 10,
          }}
        >
          <Ionicons name="settings-outline" size={20} color="#2d3436" />
        </TouchableOpacity>

        <View style={{ alignItems: "center", position: "relative" }}>
          <View
            style={{ backgroundColor: "#fff5f6", borderRadius: 50, padding: 4 }}
          >
            {uploading ? (
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="large" color="#ff4d6d" />
              </View>
            ) : profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: 90, height: 90, borderRadius: 45 }}
              />
            ) : (
              <Ionicons name="person-circle" size={90} color="#ff4d6d" />
            )}
          </View>
          <TouchableOpacity
            onPress={handleSetPhoto}
            disabled={uploading}
            style={{
              position: "absolute",
              bottom: 5,
              right: 5,
              backgroundColor: "#ff4d6d",
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={globalstyles.emailname}>{user?.name}</Text>
        <Text style={globalstyles.profileMemail}>{user?.email}</Text>
        <Text style={{ fontSize: 11, color: "#a4b0be", marginTop: 6 }}>
          <Ionicons name="calendar-outline" /> Joined: {formattedDate}
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 15,
            justifyContent: "center",
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: isEditing ? "#2ed573" : "#ff4d6d",
              paddingVertical: 10,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "checkmark-circle" : "create"}
                  size={16}
                  color="#fff"
                />
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}
                >
                  {isEditing ? "Save" : "Edit Info"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!isEditing && (
            <TouchableOpacity
              onPress={handleAddAccount}
              style={{
                flex: 1,
                backgroundColor: "#e3f2fd",
                paddingVertical: 10,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="person-add-outline" size={16} color="#1976d2" />
              <Text
                style={{ color: "#1976d2", fontWeight: "bold", fontSize: 13 }}
              >
                Add Account
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Stats Card */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 15,
          marginBottom: 20,
          justifyContent: "space-around",
          elevation: 2,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ff4d6d" }}>
            {products.length}
          </Text>
          <Text style={{ fontSize: 12, color: "#a4b0be" }}>Properties</Text>
        </View>
        <View style={{ width: 1, backgroundColor: "#f1f2f6" }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#2ed573" }}>
            Active
          </Text>
          <Text style={{ fontSize: 12, color: "#a4b0be" }}>Status</Text>
        </View>
        <View style={{ width: 1, backgroundColor: "#f1f2f6" }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0984e3" }}>
            User
          </Text>
          <Text style={{ fontSize: 12, color: "#a4b0be" }}>Role</Text>
        </View>
      </View>

      {/* Personal Details Card */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 20,
          elevation: 3,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#2d3436",
            marginBottom: 12,
          }}
        >
          Personal Details
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 15,
            gap: 12,
          }}
        >
          <View
            style={{ backgroundColor: "#f1f2f6", padding: 8, borderRadius: 10 }}
          >
            <Ionicons name="at-outline" size={18} color="#57606f" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: "#a4b0be" }}>Username</Text>
            {isEditing ? (
              <TextInput
                value={username}
                onChangeText={setUsername}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 6,
                  fontSize: 14,
                  color: "#2d3436",
                  marginTop: 3,
                  backgroundColor: "#fafafa",
                }}
              />
            ) : (
              <Text
                style={{ fontSize: 14, color: "#2d3436", fontWeight: "500" }}
              >
                {username}
              </Text>
            )}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 15,
            gap: 12,
          }}
        >
          <View
            style={{ backgroundColor: "#f1f2f6", padding: 8, borderRadius: 10 }}
          >
            <Ionicons name="information-circle" size={18} color="#57606f" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: "#a4b0be" }}>Bio</Text>
            {isEditing ? (
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 6,
                  fontSize: 14,
                  color: "#2d3436",
                  marginTop: 3,
                  backgroundColor: "#fafafa",
                }}
              />
            ) : (
              <Text
                style={{ fontSize: 14, color: "#2d3436", fontStyle: "italic" }}
              >
                {bio}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{ backgroundColor: "#f1f2f6", padding: 8, borderRadius: 10 }}
          >
            <Ionicons name="call" size={18} color="#57606f" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: "#a4b0be" }}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 6,
                  fontSize: 14,
                  color: "#2d3436",
                  marginTop: 3,
                  backgroundColor: "#fafafa",
                }}
              />
            ) : (
              <Text
                style={{ fontSize: 14, color: "#2d3436", fontWeight: "500" }}
              >
                {phone}
              </Text>
            )}
          </View>
        </View>
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          color: "#2d3436",
          marginBottom: 10,
          marginLeft: 5,
        }}
      >
        My Listed Properties
      </Text>
    </View>
  );

  return (
    <View
      style={[
        globalstyles.container,
        { backgroundColor: "#f5f6fa", paddingHorizontal: 15, flex: 1 },
      ]}
    >
      <FlatList
        data={products}
        keyExtractor={(item) => item.$id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ff4d6d"]}
          />
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              marginBottom: 10,
              alignItems: "center",
              elevation: 2,
            }}
          >
            <Image
              source={getImageSource(item.imageUrl)}
              style={{
                width: 65,
                height: 65,
                borderRadius: 8,
                backgroundColor: "#f1f2f6",
              }}
              onError={(e) => {
                console.log("Image loading error:", e.nativeEvent.error);
              }}
            />

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#2d3436" }}
              >
                {item.name || "No Name"}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#ff4d6d",
                  fontWeight: "700",
                  marginTop: 2,
                }}
              >
                ${item.price || "0"}
              </Text>
            </View>

            {/* ACTION BUTTONS: EDIT IMAGE, EDIT DETAILS & DELETE */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {/* Edit Image Button */}
              <TouchableOpacity
                onPress={() => handleEditPropertyImage(item)}
                style={{
                  backgroundColor: "#e3f2fd",
                  padding: 8,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="image-outline" size={18} color="#1976d2" />
              </TouchableOpacity>

              {/* Edit Details Button (Name & Price) */}
              <TouchableOpacity
                onPress={() => handleOpenEditModal(item)}
                style={{
                  backgroundColor: "#e8f5e9",
                  padding: 8,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="create-outline" size={18} color="#2e7d32" />
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={() => handleDeleteProperty(item)}
                style={{
                  backgroundColor: "#ffebee",
                  padding: 8,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#c62828" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={[
          globalstyles.containerFlatlist,
          { paddingBottom: 20 },
        ]}
        ListEmptyComponent={
          <View
            style={{ alignItems: "center", marginTop: 20, paddingBottom: 40 }}
          >
            <Text style={{ color: "#7f8c8d", fontSize: 14 }}>
              No properties found.
            </Text>
          </View>
        }
      />

      {/* MODAL: EDIT PROPERTY DETAILS (NAME & PRICE) */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#2d3436",
                marginBottom: 15,
              }}
            >
              Property Odeeffannoo Jijjiiri
            </Text>

            <Text style={{ fontSize: 12, color: "#a4b0be", marginBottom: 4 }}>
              Maqaa Property
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Maqaa haaraa galchi"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, color: "#a4b0be", marginBottom: 4 }}>
              Gatii ($)
            </Text>
            <TextInput
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              placeholder="Gatii haaraa galchi"
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                fontSize: 15,
                marginBottom: 20,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#f1f2f6",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#2d3436", fontWeight: "bold" }}>
                  Dhiisi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSavePropertyDetails}
                disabled={updatingProperty}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#2ed573",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                {updatingProperty ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SETTINGS */}
      <Modal
        visible={settingsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={() => setSettingsModalVisible(false)}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#2d3436",
                marginBottom: 15,
                textAlign: "center",
              }}
            >
              Settings & Options
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f2f6",
              }}
              onPress={() => {
                setSettingsModalVisible(false);
                Alert.alert("App Settings", "Gara Settings tti si geessa...");
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#2d3436" />
              <Text style={{ fontSize: 15, color: "#2d3436" }}>
                App Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                gap: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f2f6",
              }}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#d63031" />
              <Text
                style={{ fontSize: 15, color: "#d63031", fontWeight: "bold" }}
              >
                Log Out
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSettingsModalVisible(false)}
              style={{
                marginTop: 15,
                paddingVertical: 12,
                backgroundColor: "#f1f2f6",
                borderRadius: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "bold", color: "#2d3436" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
// app/profile.jsx
