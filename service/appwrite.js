import {
  Client, // 'client' osoo hin taane 'Client' ta'uu qaba (C guddaa)
  Account,
  Databases, // 'Database' osoo hin taane 'Databases' (s dabalata)
  Storage,
  ID,
  Query,
} from "react-native-appwrite"; // Maqaan package 'react-native-appwrite' dha
import "react-native-url-polyfill/auto";

// 1. Client qindeessi
const client = new Client(); // 'new client()' osoo hin taane 'new Client()'
client
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // 'setEndPoint' osoo hin taane 'setEndpoint' (p xiqqaa)
  .setProject("69f5d7ee002539e83897");

// 2. Instance-wwan biroo uumi
// "client" (string) osoo hin taane, variable 'client' isa olitti uumne sana galchi
export const account = new Account(client);
export const database = new Databases(client);
export const storage = new Storage(client);
export const query = new Query(client); // Yoo Query gara appwrite irraa export gochuu barbaadde, asitti export gochuu dandeessa

export { ID, Storage }; // Yoo ID fi Query gara appwrite irraa export gochuu barbaadde, asitti export gochuu dandeessa



const handleReviewSubmit = async () => {
  if (rating === 0) {
    Alert.alert("Akeekkachiisa", "Mee sadarkaa urjii filadhaa!");
    return;
  }

  try {
    // 1. Appwrite Auth irraa User ID ammaa jiru argachuu
    const currentUser = await account.get();
    const userId = currentUser.$id; // ID fayyadamaa (User ID)

    // 2. Appwrite collection "reviews" keessatti ol-kaa'uu
    await database.createDocument(
      "69f5df9e0023e090ae30", // Database ID
      "6ad8462c0018075c8e28", // Collection ID (reviews)
      ID.unique(),
      {
        propertyId: item.id,
        userId: userId,        // <--- Asirratti ID auth irraa dhufe galchita
        rating: rating,
        reviewText: reviewText,
        createdAt: new Date().toISOString(),
      }
    );

    Alert.alert("Galatoomaa!", "Yaadni keessan milkaa'inaan ergameera.");
    setRating(0);
    setReviewText("");
  } catch (error) {
    console.error("Error submitting review:", error);
    // Yoo fayyadamaan login hin godhin (not logged in) ta'e asirratti error qabachuu dandeessa
    Alert.alert("Error", "Yaada erguuf dura login gochuu qabda!");
  }
};