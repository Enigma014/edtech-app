// src/screens/Updates.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,

} from "react-native";
import { theme } from "../core/theme";
import Navbar from "../components/Navbar";
import Ionicons from "react-native-vector-icons/Ionicons";
import { TextInput } from "react-native";
const updates = [
  {
    id: "1",
    title: "New Physics Lecture Uploaded",
    desc: "Watch the latest lecture on Thermodynamics.",
    date: "20 Aug",
  },
  {
    id: "2",
    title: "Weekly Chemistry Quiz",
    desc: "Chemistry weekly quiz is live. Try now!",
    date: "18 Aug",
  },
];

const Updates = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>

        
        <FlatList
          data={updates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.updateCard}>
              <Text style={styles.updateDate}>📢 {item.date}</Text>
              <Text style={styles.updateTitle}>{item.title}</Text>
              <Text style={styles.updateDesc}>{item.desc}</Text>
              <TouchableOpacity style={styles.watchButton}>
                <Text style={styles.watchText}>View</Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={
            <View>
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#888" />
                <TextInput
                  placeholder="Search updates..."
                  placeholderTextColor="#888"
                  style={styles.searchInput}
                />
              </View>
              <Text style={styles.sectionTitle}>Updates</Text>
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
    marginBottom : 15,
  },
  updateCard: {
    backgroundColor: theme.colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  updateDate: { color: "#eee", fontSize: 12 },
  updateTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
  updateDesc: { color: "#fff", fontSize: 14, marginTop: 6 },
  watchButton: {
    marginTop: 10,
    backgroundColor: "#222",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  watchText: { color: "#fff", fontWeight: "600" },
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

export default Updates;
