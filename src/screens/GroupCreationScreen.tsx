import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  Alert 
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useNavigation, useRoute } from "@react-navigation/native";

interface User {
  id: string;
  name: string;
}

export default function GroupCreationScreen() {
  const [groupName, setGroupName] = useState("");
  const [groupPic, setGroupPic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  // ✅ safe defaults
  const { selectedMembers = [], selectedUsersData = [] } = route.params || {};
  
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      return Alert.alert("Error", "Enter a group name");
    }

    if (!Array.isArray(selectedMembers) || selectedMembers.length === 0) {
      return Alert.alert("Error", "Select at least one member");
    }

    const currentUser = auth().currentUser;
    if (!currentUser) return Alert.alert("Error", "Please login again");

    setLoading(true);

    try {
      const groupRef = firestore().collection("groups").doc();

      // Make sure members array contains only UIDs
      const members = [currentUser.uid, ...selectedMembers.map((m: any) => m.id || m)];

      await groupRef.set({
        id: groupRef.id,
        name: groupName,
        groupPic: groupPic || null,
        members,                     // includes current user + selected members
        createdBy: currentUser.uid,
        admin: currentUser.uid,      // ✅ assign current user as admin
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessage: "Group created",
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        isGroup: true,
      });
      

      // Navigate to ChatScreen with group info
      navigation.navigate("ChatScreen", {
        groupId: groupRef.id,
        isGroup: true,
        groupName: groupName,
      });
      
    } catch (error) {
      console.error("Failed to create group:", error);
      Alert.alert("Error", "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Group</Text>

      {/* Group Image */}
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => Alert.alert("Pick Image (to implement later)")}
      >
        {groupPic ? (
          <Image source={{ uri: groupPic }} style={styles.groupImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Group Name Input */}
      <TextInput
        placeholder="Group Name"
        placeholderTextColor="#777"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      {/* Selected Members */}
      <View style={styles.membersSection}>
        <Text style={styles.membersTitle}>
          Members ({selectedMembers.length + 1})
        </Text>
        <Text style={styles.membersList}>
          {selectedUsersData.map((user: User) => user.name).join(", ")}
          {selectedUsersData.length > 0 ? " and you" : "You"}
        </Text>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[
          styles.createButton,
          (!groupName.trim() || loading) && styles.createButtonDisabled
        ]}
        onPress={handleCreateGroup}
        disabled={!groupName.trim() || loading}
      >
        <Text style={styles.createButtonText}>
          {loading ? "Creating..." : "Create Group"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: "#ECE5DD"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#075E54",
    textAlign: "center",
    marginBottom: 30,
  },
  imageContainer: {
    alignSelf: "center",
    marginBottom: 30,
  },
  groupImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  placeholderText: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "200",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: "#000000",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  membersSection: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#075E54",
    marginBottom: 8,
  },
  membersList: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "#25D366",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  createButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
