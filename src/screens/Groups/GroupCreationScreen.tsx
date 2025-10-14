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
  
  const handleCreateGroup = async () => {
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
      // 🚨 For community groups
      if (communityId) {
        console.log("🏢 Creating community group for community:", communityId);
        
        // Create group in community's groups subcollection
        const communityGroupRef = await firestore()
          .collection('communities')
          .doc(communityId)
          .collection('groups')
          .add({
            // Basic group info
            name: groupName.trim(),
            description: `Group for ${groupName}`,
            isAnnouncement: false,
            
            // Member info
            members: [currentUser.uid, ...selectedMembers.map((m: any) => m.id || m)],
            createdBy: currentUser.uid,
            admin: currentUser.uid,
            
            // Timestamps
            createdAt: firestore.FieldValue.serverTimestamp(),
            lastMessage: "Group created",
            lastMessageTime: firestore.FieldValue.serverTimestamp(),
            
            // Media
            groupPic: groupPic || null,
            
            // Community identification
            isCommunityGroup: true,
            communityId: communityId,
            
            // 🚨 CRITICAL: Add groupId field for navigation
            groupId: `community_${communityId}_${Date.now()}`,
            
            // For display
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });

        console.log("✅ [DEBUG CREATION] Group created successfully!");
        console.log("📝 [DEBUG CREATION] Group details:", {
          name: groupName.trim(),
          communityId: communityId,
          documentId: communityGroupRef.id,
          path: `communities/${communityId}/groups/${communityGroupRef.id}`
        });
        
        Alert.alert("Success", "Group added to community successfully!");
        
        // 🚨 Navigate back to Community screen (main Community.tsx)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Community' }], // This should be your main Community.tsx screen
        });
        
      } else {
        // 🚨 Regular group creation (non-community)
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
        };

        await groupRef.set(groupData);

        // Navigate to ChatScreen for regular groups only
        navigation.navigate("ChatScreen", {
          groupId: groupRef.id,
          isGroup: true,
          groupName: groupName,
        });
      }
      
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
            🏢 This group will be created in your community and will appear in the Community section
          </Text>
        )}
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
          {loading ? "Creating..." : communityId ? "Create Community Group" : "Create Group"}
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