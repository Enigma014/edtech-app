// src/screens/Products.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { theme } from "../core/theme";
import Navbar from "../components/Navbar";
import Ionicons from "react-native-vector-icons/Ionicons";
import SearchBox from "../components/SearchBox";





const Product = ({ navigation }: { navigation: any }) => {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
  <Text style={styles.sectionTitle}>Products</Text>

  {/* SearchBox container */}
  <View
    style={{
      height: 1,
      backgroundColor: "#ddd",
      marginVertical: 8,
    }}
  />
  {/* <View style={styles.searchWrapper}>
    <SearchBox />
  </View> */}
<Text style={styles.anotherTitle}>Coming soon ...</Text>
  {/* Tabs row */}
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 10,
    }}
  >
    {/* Add tabs if needed */}
  </View>

  {/* Empty space */}
  <View style={{ flex: 1 }} />

  {/* Navbar */}
  <Navbar navigation={navigation} />
</View>


  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },

  sectionTitle: {
    fontSize: 24, fontWeight: "600", marginLeft: 20,marginTop:40,marginBottom:15, color: "#000",
  },
  anotherTitle: {
    fontSize: 16, fontWeight: "600", marginLeft: 20,marginTop:20,marginBottom:15, color: "#000",
  },

  
  
  // Search
  
});

export default Product;
