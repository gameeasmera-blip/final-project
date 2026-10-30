import { View, Image, Text, StyleSheet } from "react-native";
import { globalstyles } from "../styles/globalStyles";

export default function MinCard({ item }) {
  // Yoo imageUrl hin jirre ykn duudaa ta'e fakkii placeholder dhiheessa
  const fallbackImage =
    "https://via.placeholder.com/150/e1e1e1/808080?text=No+Image";

  return (
    <View style={[globalstyles.card, styles.cardContainer]}>
      <Image
        source={{ uri: item?.imageUrl || fallbackImage }}
        style={[globalstyles.imageSmall, styles.imageStyle]}
        resizeMode="cover"
      />
      <View style={[globalstyles.infoFlex, styles.infoContainer]}>
        {/* 'item.name' ykn 'item.title' lamaanisaa akka dubbisuuf */}
        <Text style={globalstyles.nameSmall} numberOfLines={1}>
          {item?.name || item?.title || "Property"}
        </Text>
        <Text style={globalstyles.PriceSmall}>
          ${item?.price !== undefined ? item.price : "0"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  imageStyle: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#e1e1e1", // Fakkichii load hanga ta'utti bakka fakkichaa agarsiisuuf
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
});
