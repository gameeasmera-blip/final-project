import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "./index";
export default function ProfileScreen() {
  return (
    <View style={styles.Container}>
      <Text style={styles.Title}>profile screen</Text>

      <Link href="/" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>GO BACK at</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
