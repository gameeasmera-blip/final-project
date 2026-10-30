import React, { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { globalstyles } from "../styles/globalStyles";
import { account, database, ID, storage } from "../service/appwrite";

export default function PropertyForm() {
  const categories = ["All", "Villa", "Apartment", "House", "Condo"];

  // 1. Filannoo Form: "image" ykn "video"
  const [mediaType, setMediaType] = useState("image"); // 'image' | 'video'

  // Common Form States
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Image Form States
  const [images, setImages] = useState([]);

  // Video Form States
  const [video, setVideo] = useState(null); // Viidiyoof
  const [videoUrl, setVideoUrl] = useState(""); // YouTube ykn Link viidiyoo

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Suuraalee Filachuu
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Sirreeffama kana
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  // Viidiyoo Filachuu
 const pickVideo = async () => {
   let result = await ImagePicker.launchImageLibraryAsync({
     mediaTypes: ["videos"], // Sirreeffama kana
     allowsEditing: true,
     quality: 0.3,
   });

   if (!result.canceled) {
     setVideo(result.assets[0]);
   }
 };
  // Form Submit Gochuu
  const handleSubmit = async () => {
    // Validation
    if (!name || !price || !phone || !selectedCategory || !description) {
      Alert.alert("Validation Error", "Maaloo bakka hunda guutaa.");
      return;
    }

    if (mediaType === "image" && images.length === 0) {
      Alert.alert(
        "Validation Error",
        "Maaloo yoo xiyyaate suuraa tokko filadhaa.",
      );
      return;
    }

    if (mediaType === "video" && !video && !videoUrl) {
      Alert.alert(
        "Validation Error",
        "Maaloo viidiyoo filadhaa ykn Link viidiyoo galchaa.",
      );
      return;
    }

    setUploading(true);

    try {
      // 1. Session verification
      let userEmail = "gamee@gmail.com";
      try {
        const userData = await account.get();
        if (userData && userData.email) {
          userEmail = userData.email;
        }
      } catch (err) {
        console.log(
          "No active user session, attempting anonymous session...",
          err,
        );
        try {
          await account.createAnonymousSession();
        } catch (anonErr) {
          console.log("Anonymous session bypass:", anonErr);
        }
      }

      let uploadedImageIds = [];
      let uploadedVideoId = "";

      // 2. Yoo SUURAA ta'e: Suuraalee Upload Gochuu
      if (mediaType === "image") {
        const uploadPromises = images.map(async (img) => {
          const uri =
            Platform.OS === "android"
              ? img.uri
              : img.uri.replace("file://", "");
          const fileName =
            img.fileName ||
            img.uri.split("/").pop() ||
            `photo_${Date.now()}.jpg`;
          const fileType = fileName.split(".").pop()?.toLowerCase();

          const fileObject = {
            name: fileName,
            type:
              img.mimeType ||
              `image/${fileType === "jpg" ? "jpeg" : fileType || "jpeg"}`,
            uri: uri,
            size: img.fileSize || 1000,
          };

          const uploadResponse = await storage.createFile(
            "69f5f4f7003246f224f5", // Bucket ID
            ID.unique(),
            fileObject,
          );

          if (!uploadResponse || !uploadResponse.$id) {
            throw new Error("Suuraa fe'uun hin danda'amne.");
          }

          return uploadResponse.$id;
        });

        uploadedImageIds = await Promise.all(uploadPromises);
      }

      // 3. Yoo VIIDIYOO ta'e: Viidiyoo Upload Gochuu
      if (mediaType === "video" && video) {
        const uri =
          Platform.OS === "android"
            ? video.uri
            : video.uri.replace("file://", "");
        const fileName =
          video.fileName ||
          video.uri.split("/").pop() ||
          `video_${Date.now()}.mp4`;

        const fileObject = {
          name: fileName,
          type: video.mimeType || "video/mp4",
          uri: uri,
          size: video.fileSize || 100000,
        };

        const uploadResponse = await storage.createFile(
          "69f5f4f7003246f224f5", // Bucket ID
          ID.unique(),
          fileObject,
        );

        uploadedVideoId = uploadResponse.$id;
      }

      // 4. Database irratti document uumuu
      await database.createDocument(
        "69f5df9e0023e090ae30", // Database ID
        "property", // Collection ID
        ID.unique(),
        {
          name: name,
          price: Number(price),
          phone: phone,
          Category: selectedCategory,
          description: description,
          imageIds: uploadedImageIds,
          imageId: uploadedImageIds[0] || "",
          videoId: uploadedVideoId,
          videoUrl: videoUrl,
          mediaType: mediaType, // 'image' ykn 'video'
          email: userEmail,
        },
      );

      Alert.alert("Success", "Qabeenyi milkaa'inaan dabalameera!");

      // Form Cleardown
      setName("");
      setSelectedCategory(null);
      setPhone("");
      setPrice("");
      setDescription("");
      setImages([]);
      setVideo(null);
      setVideoUrl("");
    } catch (error) {
      console.log("Error detail:", error);
      Alert.alert("Error", error.message || "Wanti dogoggorame jira.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView
          style={[globalstyles.containerGrey]}
          contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={globalstyles.titleLarge}>Add New Property</Text>

          {/* ---------------- OPTION SELECTOR (Suuraa / Viidiyoo) ---------------- */}
          <Text style={{ marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>
            Midiyaa Filadhaa (Media Type)
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
            <TouchableOpacity
              onPress={() => setMediaType("image")}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: mediaType === "image" ? "#007AFF" : "#E5E5EA",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name="images"
                size={18}
                color={mediaType === "image" ? "white" : "black"}
              />
              <Text
                style={{
                  color: mediaType === "image" ? "white" : "black",
                  fontWeight: "bold",
                }}
              >
                Suuraa (Images)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMediaType("video")}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: mediaType === "video" ? "#007AFF" : "#E5E5EA",
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons
                name="videocam"
                size={18}
                color={mediaType === "video" ? "white" : "black"}
              />
              <Text
                style={{
                  color: mediaType === "video" ? "white" : "black",
                  fontWeight: "bold",
                }}
              >
                Viidiyoo (Video)
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------------- COMMON FIELDS ---------------- */}
          <TextInput
            style={globalstyles.TextInput}
            placeholder="Property Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={globalstyles.TextInput}
            placeholder="Property Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={globalstyles.TextInput}
            placeholder="Contact Phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={{ marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>
            Select Category
          </Text>
          <View style={globalstyles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  globalstyles.categoryButton,
                  selectedCategory === category &&
                    globalstyles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    globalstyles.categoryButtonText,
                    selectedCategory === category &&
                      globalstyles.selectedCategoryButtonText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[globalstyles.TextInput, { height: 100, marginTop: 15 }]}
            placeholder="Description"
            multiline={true}
            numberOfLines={4}
            value={description}
            textAlignVertical="top"
            onChangeText={setDescription}
          />

          {/* ---------------- OPTION 1: SUURAA (IMAGE SECTION) ---------------- */}
          {mediaType === "image" && (
            <View style={{ marginTop: 10 }}>
              <Text style={globalstyles.PropertyImage}>Property Images</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 10 }}
              >
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {images.map((img, index) => (
                    <View key={index} style={{ position: "relative" }}>
                      <Image
                        source={{ uri: img.uri }}
                        style={{
                          width: 90,
                          height: 90,
                          borderRadius: 10,
                          backgroundColor: "#ccc",
                        }}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setImages(images.filter((_, i) => i !== index))
                        }
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          borderRadius: 10,
                          padding: 2,
                        }}
                      >
                        <Ionicons name="close-circle" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={pickImage}
                style={globalstyles.pickimage}
              >
                <Ionicons
                  name="image"
                  size={20}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Suuraalee Dabali
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ---------------- OPTION 2: VIIDIYOO (VIDEO SECTION) ---------------- */}
          {mediaType === "video" && (
            <View style={{ marginTop: 10 }}>
              <Text style={globalstyles.PropertyImage}>Property Video</Text>

              {/* YouTube ykn External Link */}
              <TextInput
                style={globalstyles.TextInput}
                placeholder="YouTube ykn Video Link (Optional)"
                value={videoUrl}
                onChangeText={setVideoUrl}
              />

              <Text
                style={{
                  marginVertical: 5,
                  textAlign: "center",
                  color: "#666",
                }}
              >
                -- YKN (OR) --
              </Text>

              {/* Directly Upload Video File */}
              {video ? (
                <View
                  style={{
                    padding: 12,
                    backgroundColor: "#e3f2fd",
                    borderRadius: 8,
                    marginBottom: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, fontWeight: "500" }}
                  >
                    🎥 {video.fileName || "Video Selected"}
                  </Text>
                  <TouchableOpacity onPress={() => setVideo(null)}>
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickVideo}
                  style={[
                    globalstyles.pickimage,
                    { backgroundColor: "#28a745" },
                  ]}
                >
                  <Ionicons
                    name="videocam"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Viidiyoo Galagalchu/Dabali
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ---------------- SUBMIT BUTTON ---------------- */}
          <TouchableOpacity
            style={[
              globalstyles.Button,
              { marginTop: 20, marginBottom: 30, opacity: uploading ? 0.5 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={uploading}
          >
            <Text style={globalstyles.ButtonText}>
              {uploading
                ? "Uploading Media & Saving..."
                : mediaType === "image"
                  ? "Add Property (With Images)"
                  : "Add Property (With Video)"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
