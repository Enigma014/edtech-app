// src/screens/CommunityOverviewScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import GroupCard from "../components/GroupCard";

export default function CommunityOverviewScreen({ route }) {
  const { id } = route.params; // community ID from CreateCommunityScreen
  const [community, setCommunity] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch community details
  useEffect(() => {
    const fetchCommunity = async () => {
      const docRef = doc(db, "communities", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) setCommunity(snapshot.data());
    };
    fetchCommunity();
  }, [id]);

  // Listen to groups in real-time
  useEffect(() => {
    const q = query(collection(db, "communities", id, "groups"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroups(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  const addGroup = async () => {
    Alert.prompt("New Group", "Enter group name:", async (groupName) => {
      if (!groupName) return;
      try {
        await addDoc(collection(db, "communities", id, "groups"), {
          name: groupName,
          lastMessage: `Welcome to the group: ${groupName}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Couldn't add group");
      }
    });
  };

  if (loading || !community)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00a884" />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.row}>
          {community.photoURL ? (
            <Image source={{ uri: community.photoURL }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 22, color: "#fff" }}>👥</Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{community.name}</Text>
            <Text style={styles.subTitle}>
              Community · {groups.length} groups
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard
            name={item.name}
            lastMessage={item.lastMessage}
            time={item.time}
            icon={item.name === "Announcements" ? "bullhorn" : "chat-outline"}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Other groups added to the community will appear here.
          </Text>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={addGroup}>
        <Text style={styles.addButtonText}>+ Add group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#f7f5f2",
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderBottomWidth: 0.6,
    borderBottomColor: "#ddd",
  },
  row: { flexDirection: "row", alignItems: "center" },
  image: { width: 55, height: 55, borderRadius: 12, marginRight: 10 },
  imagePlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#00a884",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  name: { fontSize: 20, fontWeight: "600" },
  subTitle: { color: "#777", marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 30,
    paddingHorizontal: 30,
  },
  addButton: {
    backgroundColor: "#00a884",
    paddingVertical: 15,
    alignItems: "center",
    margin: 10,
    borderRadius: 30,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
