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
import { authService } from "../../utils/firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";

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
  
  const { selectedMembers = [], selectedUsersData = [], communityId } = route.params || {};
  
  // 🚨 FIXED: Follows the same pattern as SelectGroupsScreen but for NEW groups
  // In your GroupCreationScreen - UPDATE the community group creation
  const addGroupToCommunity = async () => {
    // 🆕 PREVENT MULTIPLE CLICKS
    if (loading) return;
    
    if (!groupName.trim()) {
      return Alert.alert("Error", "Enter a group name");
    }
  
    if (!Array.isArray(selectedMembers) || selectedMembers.length === 0) {
      return Alert.alert("Error", "Select at least one member");
    }
  
    const currentUser = authService.currentUser;
    if (!currentUser) return Alert.alert("Error", "Please login again");
  
    setLoading(true);
  
    try {
      console.log("🏢 Creating NEW community group");
      
      const members = [currentUser.uid, ...selectedMembers.map((m: any) => m.id || m)];
  
      // 🆕 CHECK IF GROUP NAME ALREADY EXISTS IN THIS COMMUNITY
      const existingGroupsSnapshot = await firestore()
        .collection("communities")
        .doc(communityId)
        .collection("groups")
        .where("name", "==", groupName.trim())
        .get();
  
      if (!existingGroupsSnapshot.empty) {
        Alert.alert("Error", "A group with this name already exists in the community");
        setLoading(false);
        return;
      }
  
      // STEP 1: Create the main group in groups collection
      const mainGroupRef = firestore().collection("groups").doc();
      
      const mainGroupData = {
        id: mainGroupRef.id,
        name: groupName.trim(),
        groupPic: groupPic || null,
        members: members,
        createdBy: currentUser.uid,
        admin: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastMessage: "Group created",
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
        isGroup: true,
        communityId: communityId,
        isCommunityGroup: true,
      };
  
      await mainGroupRef.set(mainGroupData);
  
      // STEP 2: Add to community's groups subcollection
      await firestore()
        .collection("communities")
        .doc(communityId)
        .collection("groups")
        .add({
          name: groupName.trim(),
          groupId: mainGroupRef.id,
          description: `Group for ${groupName}`,
          isAnnouncement: false,
          lastMessage: "Group created",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: firestore.FieldValue.serverTimestamp(),
          members: members,
          createdBy: currentUser.uid,
          admin: currentUser.uid,
          isCommunityGroup: true,
          communityId: communityId,
        });
  
      console.log("✅ [DEBUG] New community group created successfully!");
      
      // 🆕 SUCCESS: Navigate back to Community screen
      Alert.alert("Success", "Group added to community successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Go back to Community screen
            navigation.navigate('CommunityScreen');
          }
        }
      ]);
      
    } catch (error) {
      console.error("❌ Error adding group to community:", error);
      Alert.alert("Error", "Failed to add group to community");
    } finally {
      setLoading(false);
    }
  };

const handleCreateGroup = async () => {
  // 🆕 PREVENT MULTIPLE CLICKS
  if (loading) return;
  
  if (!groupName.trim()) {
    return Alert.alert("Error", "Enter a group name");
  }

  if (!Array.isArray(selectedMembers) || selectedMembers.length === 0) {
    return Alert.alert("Error", "Select at least one member");
  }

  const currentUser = authService.currentUser;
  if (!currentUser) return Alert.alert("Error", "Please login again");

  // 🆕 USE THE FIXED FUNCTION for community groups
  if (communityId) {
    return addGroupToCommunity();
  }

  // Regular group creation (non-community) - UNCHANGED
  setLoading(true);

  try {
    console.log("💬 Creating regular group (non-community)");
    
    const groupRef = firestore().collection("groups").doc();
    
    const members = [currentUser.uid, ...selectedMembers.map((m: any) => m.id || m)];

    const groupData = {
      id: groupRef.id,
      name: groupName,
      groupPic: groupPic || null,
      members,
      createdBy: currentUser.uid,
      admin: currentUser.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastMessage: "Group created",
      lastMessageTime: firestore.FieldValue.serverTimestamp(),
      isGroup: true,
      isCommunityGroup: false,
    };

    await groupRef.set(groupData);

    console.log("✅ [DEBUG] Regular group created successfully!");

    // Navigate to ChatScreen for regular groups only
    navigation.navigate("ChatScreen", {
      groupId: groupRef.id,
      isGroup: true,
      groupName: groupName,
    });
    
  } catch (error) {
    console.error("❌ Failed to create group:", error);
    Alert.alert("Error", "Failed to create group");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {communityId ? "New Community Group" : "New Group"}
      </Text>

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
        {communityId && (
          <Text style={styles.communityNote}>
            🏢 This group will be added using the same pattern as "Add Existing Groups"
          </Text>
        )}
      </View>

      {/* Create Button */}
      {/* Create Button */}
<TouchableOpacity
  style={[
    styles.createButton,
    (!groupName.trim() || loading) && styles.createButtonDisabled
  ]}
  onPress={handleCreateGroup}
  disabled={!groupName.trim() || loading} // 🆕 THIS IS IMPORTANT
>
  <Text style={styles.createButtonText}>
    {loading ? "Creating..." : communityId ? "Add to Community" : "Create Group"}
  </Text>
</TouchableOpacity>
    </View>
  );
}

// ... your styles remain the same

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
  communityNote: {
    fontSize: 12,
    color: "#25D366",
    fontStyle: "italic",
    marginTop: 8,
    fontWeight: "500",
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