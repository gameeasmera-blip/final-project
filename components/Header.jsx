import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { globalstyles } from "../styles/globalStyles";
import { useRouter } from "expo-router";

export default function Header() {
  const router = useRouter();

  return (
    <View style={globalstyles.header}>
      {/* Profile Button */}
      <TouchableOpacity
        onPress={() => router.push("/profile")}
        style={globalstyles.profilebtn}
      >
        <Ionicons style={{ color: "red" }} name="person-circle" size={30} />
        <Text></Text>
      </TouchableOpacity>

      {/* Video Icon */}
      <TouchableOpacity
        onPress={() => router.push("/HeaderReels")}
        style={globalstyles.profilebtn}
      >
        <Ionicons style={{ color: "red" }} name="film-outline" size={30} />
      </TouchableOpacity>

      {/* Logo / Contact */}

      {/* Notification Icon */}
      <TouchableOpacity
        onPress={() => router.push("/notifications")} // path kee sirreessuu dandeessa
        style={globalstyles.profilebtn}
      >
        <Ionicons name="notifications-outline" size={30} color="red" />
      </TouchableOpacity>

      {/* Sign Up / Logout */}
      <TouchableOpacity
        onPress={() => router.push("/signUp")}
        style={globalstyles.profilebtn}
      >
        <Ionicons name="log-out-outline" size={30} color="red" />
      </TouchableOpacity>
    </View>
  );
}
