// src/screens/ManageGroupsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function ManageGroupsScreen({ route }) {
  const { id } = route.params; // community id
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, "communities", id, "groups");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  const createNewGroup = () => {
    Alert.prompt("Create new group", "Enter group name:", async (groupName) => {
      if (!groupName) return;
      try {
        await addDoc(collection(db, "communities", id, "groups"), {
          name: groupName,
          isAnnouncement: false,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Couldn't create new group.");
      }
    });
  };

  const addExistingGroup = () => {
    Alert.alert(
      "Add existing groups",
      "Feature coming soon — will allow linking groups already created in Firebase."
    );
  };

  const deleteGroup = async (groupId) => {
    Alert.alert("Delete group", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "communities", id, "groups", groupId));
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to delete group.");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#00a884" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Manage groups</Text>
      <Text style={styles.subHeader}>{groups.length} of 101</Text>

      {/* Create / Add buttons */}
      <TouchableOpacity style={styles.actionRow} onPress={createNewGroup}>
        <View style={styles.actionIcon}>
          <Icon name="account-group" size={22} color="#fff" />
        </View>
        <Text style={styles.actionText}>Create new group</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionRow} onPress={addExistingGroup}>
        <View style={[styles.actionIcon, { backgroundColor: "#00a884" }]}>
          <Icon name="plus" size={22} color="#fff" />
        </View>
        <Text style={styles.actionText}>Add existing groups</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Members can suggest existing groups for admin approval and add new groups directly.{" "}
        <Text style={{ color: "#1a73e8" }}>View in Community settings</Text>
      </Text>

      {/* Groups list */}
      <Text style={styles.sectionTitle}>Groups in this community</Text>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.groupRow}>
            <View style={styles.groupIcon}>
              <Icon
                name={item.isAnnouncement ? "bullhorn" : "chat-outline"}
                size={22}
                color="#333"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupSub}>You</Text>
            </View>

            <TouchableOpacity onPress={() => deleteGroup(item.id)}>
              <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No groups yet. Create or add existing ones.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 15 },
  header: { fontSize: 20, fontWeight: "600", marginTop: 15 },
  subHeader: { color: "#777", marginBottom: 20 },
  actionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00a884",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  actionText: { fontSize: 16, fontWeight: "500" },
  infoText: {
    color: "#666",
    fontSize: 13,
    marginTop: 10,
    marginBottom: 15,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  groupIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f3f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  groupName: { fontSize: 16, fontWeight: "500" },
  groupSub: { fontSize: 13, color: "#888" },
  emptyText: {
    textAlign: "center",
    marginTop: 25,
    color: "#777",
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
