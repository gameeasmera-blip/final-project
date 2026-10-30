import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { globalstyles } from "../styles/globalStyles";
export default function Footer() {
  const router = useRouter();
  return (
    <View style={globalstyles.footerContainer}>
      <TouchableOpacity
        style={[globalstyles.footerBtn, globalstyles.footerBtn]}
        onPress={() => router.push("/")}
      >
        <Ionicons name="home-outline" size={24} color="red" />
        <Text style={globalstyles.footerText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/propertyForm")}
        style={[globalstyles.footerBtn, globalstyles.footerBtn]}
      >
        <View style={globalstyles.addBtn}>
          <Ionicons name="add" size={24} color="red" />
        </View>
      </TouchableOpacity>


      <TouchableOpacity
        onPress={() => router.push("/save")}
        style={[globalstyles.footerBtn, globalstyles.footerBtn]}
      >
        <Ionicons name="bookmark-outline" size={24} color="red" />
        <Text style={globalstyles.footerText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}
