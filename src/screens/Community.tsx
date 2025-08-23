// src/screens/Community.tsx
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
const questions = [
  {
    id: "1",
    title: "How to prepare for Organic Chemistry?",
    replies: 12,
  },
  {
    id: "2",
    title: "Doubt in Physics - Thermodynamics Problem",
    replies: 4,
  },
];

const Community = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>

       
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.questionCard}>
              <Text style={styles.questionTitle}>{item.title}</Text>
              <Text style={styles.repliesText}>{item.replies} replies</Text>
              <TouchableOpacity style={styles.replyButton}>
                <Text style={styles.replyText}>Reply</Text>
              </TouchableOpacity>
            </View>
          )}
          ListHeaderComponent={
          <View>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                placeholder="Search products..."
                placeholderTextColor="#888"
                style={styles.searchInput}
              />
            </View>
          <Text style={styles.sectionTitle}>Community</Text>
            </View>}
          contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        />

      <TouchableOpacity style={styles.askButton}>
        <Text style={styles.askText}>+ Ask Question</Text>
      </TouchableOpacity>
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
    marginBottom:15,

  },
  questionCard: {
    backgroundColor: theme.colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  questionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  repliesText: { color: "#eee", marginTop: 4 },
  replyButton: {
    marginTop: 10,
    backgroundColor: "#222",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  replyText: { color: "#fff", fontWeight: "600" },
  askButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 4,
  },
  askText: { color: "#fff", fontWeight: "700" ,marginBottom:5},
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

export default Community;
