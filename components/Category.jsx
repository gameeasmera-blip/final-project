 import { globalstyles } from "../styles/globalStyles";
import { FlatList,Text, TouchableOpacity} from "react-native";
 
 export  default function Category({ categories, selectedCategory, onselect}) {
     
    return (
    
        <FlatList
            data = {categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={ (cat) => cat}
        
            renderItem={({item})=>(
               <TouchableOpacity 
                 style={[
                   globalstyles.categoryBtn,
                   item===selectedCategory && globalstyles.categorySelected
                 ]}
                 onPress={() => onselect(item)}
               >
                <Text style={[globalstyles.categoryText, 
                 item===selectedCategory && globalstyles.categoryTextSelected

                ]}>{item}</Text>
               </TouchableOpacity>

            )}
            contentContainerStyle={globalstyles.categoryList}
            />
        );
        }
    
