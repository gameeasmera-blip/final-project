import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@saved_items";                         //akka qulifitii yeroo fayyadamuuf
export const getItems = async () => {                        //storage irraa dataa guutuu qabachuuf
    try {                                                    // yeroo dataa guutuu qabachuuf
        const items = await AsyncStorage.getItem(STORAGE_KEY);  //dataa guutuu qabachuuf
        return items!= null ? JSON.parse(items) : [];         //yeroo dataa guutuu qabachuuf
    } catch (error) {                                  //data guutuu qabachuuf yeroo dogoggora uumamu
        console.error("Error getting items from storage:", error);
        return [];                                             //data kennaa qabachuuf yeroo dogoggora uumamu
    }
};

export const saveItem = async (item) => {                      // storage keessatti dataa kuusuu
  try {                                                             // storage yeroo dataa kuusuu
    const savedItems = await getItems();
    const existingIndex = savedItems.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      savedItems[existingIndex] = item;//dataa jijiruu
    } else {//yeroo dataa haaraa dabaluuf
      savedItems.push(item);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems)); //dataa kuusuu
  } catch (error) {
    console.error("Error saving item to storage:", error);
  }

};
export const removeItem = async (itemid) => {//storage keessaa dataa haquu
  try {
    const savedItems = await getItems();
    const filteredItems = savedItems.filter((i) => i.id !== itemid);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems));
  } catch (error) {
    console.error("Error removing item from storage:", error);
    return false;
  }
};
