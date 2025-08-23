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

const products = [
  {
    id: "1",
    title: "Mock Test Series",
    price: "₹499",
    oldPrice: "₹699",
    discount: "30% OFF",
    desc: "Full-length mock tests with solutions",
    image: "greenbook.png",  },
  {
    id: "2",
    title: "Handwritten Notes",
    price: "₹299",
    oldPrice: "₹399",
    discount: "25% OFF",
    desc: "Crisp notes for revision",
    image: "greenbook.png",  },
  {
    id: "3",
    title: "NEET Package",
    price: "₹1499",
    oldPrice: "₹2000",
    discount: "20% OFF",
    desc: "Complete NEET prep pack",
    image: "greenbook.png",  },
];

const Product = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Banner */}
            <Image source={{ uri: item.image }} style={styles.bannerImage} />

            {/* Details */}
            <View style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>

                {/* Price Row */}
                <View style={styles.priceRow}>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                  <Text style={styles.oldPrice}>{item.oldPrice}</Text>
                  <Text style={styles.discount}>{item.discount}</Text>
                </View>
              </View>

              {/* Buy CTA */}
              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View>
            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                placeholder="Search products..."
                placeholderTextColor="#888"
                style={styles.searchInput}
              />
            </View>
            <Text style={styles.sectionTitle}>Products</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: 20,
    marginTop: 30,
    marginBottom: 20,
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },
  bannerImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  cardDesc: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  oldPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    color: "#888",
    marginLeft: 8,
  },
  discount: {
    fontSize: 14,
    fontWeight: "600",
    color: "green",
    marginLeft: 8,
  },
  buyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginLeft: 12,
  },
  buyText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 20,
    margin: 16,
    marginTop: 45,
  },
  searchInput: { flex: 1, padding: 8, color: "#fff" },
});

export default Product;
