import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Header from "../../components/Header.jsx";
import { database, storage } from "../../service/appwrite.js";
import { globalstyles } from "../../styles/globalStyles";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- States dabalataan Feature-ootaaf ---
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [contractSigned, setContractSigned] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const doc = await database.getDocument(
          "69f5df9e0023e090ae30",
          "property",
          id,
        );

        let imageUrl = "https://via.placeholder.com/150?text=No+Image";

        if (doc.imageId) {
          try {
            const fileUrl = storage.getFileView(
              "69f5f4f7003246f224f5",
              doc.imageId,
            );
            imageUrl = fileUrl.href || fileUrl.toString();
          } catch (imgError) {
            console.error("Error loading image URL:", imgError);
          }
        }

        const lat = doc.latitude ? parseFloat(doc.latitude) : null;
        const lng = doc.longitude ? parseFloat(doc.longitude) : null;

        setItem({
          id: doc.$id,
          name: doc.name || "Property",
          price: doc.price,
          Category: doc.Category,
          description: doc.description || doc.descriptio,
          phone: doc.phone,
          Gmail: doc.Gmail,
          imageUrl: imageUrl,
          latitude: lat && !isNaN(lat) ? lat : 9.0893,
          longitude: lng && !isNaN(lng) ? lng : 36.5528,
          landlordId: doc.userId || "owner_id_sample", // Landlord/Owner Appwrite ID
        });
      } catch (error) {
        console.error("Error fetching detail:", error);
        Alert.alert("Error", "Odeeffannoo fiduun hin danda'amne!");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchItemDetails();
  }, [id]);

  // 1. In-App Messaging Function
  const handleStartChat = () => {
    // Router gargaaramuun gara Chat Screen natti darba
    router.push({
      pathname: "/chat",
      params: { landlordId: item?.landlordId, propertyId: item?.id },
    });
  };

  // 2. Digital Lease Contract Modal/Navigation
  const handleSignContract = () => {
    Alert.alert(
      "Waliigaltee Digitala",
      "Waliigaltee kiraa mallatteessuuf fuula signature itti fufuuf qophiidha?",
      [
        { text: "Dhiisi", style: "cancel" },
        {
          text: "Eeyyee, Itti fufi",
          onPress: () => {
            setContractSigned(true);
            Alert.alert(
              "Milkaa'ina",
              "Waliigalteen keessan milkaa'inaan mallatteeffameera!",
            );
          },
        },
      ],
    );
  };

  // 3. Automatic Payment Reminder Setup
  const handleSetReminder = () => {
    setReminderSet(!reminderSet);
    if (!reminderSet) {
      Alert.alert(
        "Akeekkachiisa Kaffaltii",
        "Yaadachiisni kaffaltii ji'a ji'aan akka isiniif ergamuuf saaqameera!",
      );
    }
  };

  // 4. Rating & Review Submit
  const handleReviewSubmit = () => {
    if (rating === 0) {
      Alert.alert("Akeekkachiisa", "Mee sadarkaa urjii (Stars) filadhaa!");
      return;
    }
    Alert.alert(
      "Galatoomaa!",
      `Madaallii ${rating} Stars ta'e galmeessitaniirtu.`,
    );
    setReviewText("");
  };

  const handleCall = () => {
    const phoneNumber = item?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
        console.log("Error:", err),
      );
    } else {
      Alert.alert("Kallattii", "Lakkofsi bilbilaa hin jiru!");
    }
  };

  const openGoogleMaps = () => {
    if (!item) return;
    const { latitude, longitude, name } = item;
    const encodedName = encodeURIComponent(name);

    const url = Platform.select({
      ios: `maps:0,0?q=${encodedName}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          return Linking.openURL(browserUrl);
        }
      })
      .catch((err) => {
        console.error("Maps Error:", err);
        Alert.alert("Error", "Maps banuun hin danda'amne");
      });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff4d6d" />
        <Text style={{ marginTop: 10 }}>Loading details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Odeeffannoon argamuu hin dandenye.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={globalstyles.container}>
      <Header />
      <Image
        style={globalstyles.perviewImage}
        source={{ uri: item?.imageUrl }}
      />

      <View style={globalstyles.containerBox}>
        <Text style={globalstyles.nameText}>{item?.name}</Text>
        <Text
          style={{
            fontSize: 18,
            color: "#ff4d6d",
            fontWeight: "700",
            marginVertical: 5,
          }}
        >
          ${item?.price} / Ji'atti
        </Text>
        <Text style={globalstyles.priceTextt}>{item?.description}</Text>
      </View>
      {/* --- MAP SECTION --- */}
      <View style={[globalstyles.containerBox, { marginTop: 10 }]}>
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          Bakka Manaa (Location)
        </Text>

        <View style={{ height: 200, borderRadius: 12, overflow: "hidden" }}>
          <MapView
            style={{ width: "100%", height: "100%" }}
            initialRegion={{
              latitude: item.latitude,
              longitude: item.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              title={item.name}
              description="Bakka manni jiru"
            />
          </MapView>
        </View>

        <TouchableOpacity
          onPress={openGoogleMaps}
          style={{
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#4285F4",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Ionicons name="location" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>
            Google Maps irratti bani
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- FEATURE 1: IN-APP MESSAGING & QUICK ACTION BUTTONS --- */}
      <View
        style={[
          globalstyles.containerBox,
          {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 10,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleStartChat}
          style={{
            flex: 1,
            backgroundColor: "#25D366",
            padding: 12,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 5,
          }}
        >
          <Ionicons name="chatbubbles" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>
            In-App Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCall}
          style={{
            flex: 1,
            backgroundColor: "#27ae60",
            padding: 12,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 5,
          }}
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>
            Bilbili
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- FEATURE 2 & 3: DIGITAL LEASE CONTRACT & AUTOMATIC REMINDER --- */}
      <View style={[globalstyles.containerBox, { marginTop: 10 }]}>
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          Tajaajiloota Dabalataa (Manage Booking)
        </Text>

        {/* Digital Lease Contract */}
        <TouchableOpacity
          onPress={handleSignContract}
          style={{
            backgroundColor: contractSigned ? "#2ecc71" : "#8e44ad",
            padding: 12,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons
            name={contractSigned ? "checkmark-circle" : "document-text"}
            size={18}
            color="#fff"
          />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>
            {contractSigned
              ? "Waliigalteen Mallatteeffameera"
              : "Waliigaltee Digitala Mallatteessi (Digital Lease)"}
          </Text>
        </TouchableOpacity>

        {/* Payment Reminder */}
        <TouchableOpacity
          onPress={handleSetReminder}
          style={{
            backgroundColor: reminderSet ? "#e67e22" : "#34495e",
            padding: 12,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={
              reminderSet ? "notifications-active" : "notifications-outline"
            }
            size={18}
            color="#fff"
          />
          <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 6 }}>
            {reminderSet
              ? "Akeekkachiisa Kaffaltii (Active)"
              : "Yaadachiisa Kaffaltii Cufi/Bani (Payment Reminder)"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* --- FEATURE 4: RATING & REVIEW SECTION --- */}
      <View
        style={[globalstyles.containerBox, { marginTop: 10, marginBottom: 30 }]}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
          Sadarkaa fi Yaada (Rating & Review)
        </Text>

        {/* Urjii (Stars) */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={30}
                color={star <= rating ? "#f1c40f" : "#ccc"}
                style={{ marginRight: 5 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Yaada dabalataa asitti barreessi..."
          value={reviewText}
          onChangeText={setReviewText}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            padding: 10,
            minHeight: 60,
            marginBottom: 10,
          }}
          multiline
        />

        <TouchableOpacity
          onPress={handleReviewSubmit}
          style={{
            backgroundColor: "#ff4d6d",
            padding: 10,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Yaada Ergi</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
