import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { authService, db } from "../../utils/firebaseConfig"; // Import from your services file

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use authService from your firebaseServices
  const currentUser = authService.currentUser;

  useEffect(() => {
    if (!groupId) {
      Alert.alert("Error", "Group ID not provided");
      setLoading(false);
      return;
    }

    // Use db from your firebaseServices
    const unsubscribe = db.collection("groups").doc(groupId).onSnapshot(async (doc) => {
      if (!doc.exists) {
        Alert.alert("Error", "Group not found");
        setLoading(false);
        return;
      }

      const data = doc.data();
      setGroup(data);

      // Fetch member details
      if (data.members && Array.isArray(data.members)) {
        try {
          const memberDocs = await Promise.all(
            data.members.map(async (uid) => {
              const userDoc = await db.collection("users").doc(uid).get();
              const userData = userDoc.data();
              return { 
                id: uid, 
                name: userData?.name || "Unknown User",
                email: userData?.email || ""
              };
            })
          );
          setMembers(memberDocs);
        } catch (error) {
          console.error("Error fetching members:", error);
          Alert.alert("Error", "Failed to load group members");
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Error listening to group:", error);
      Alert.alert("Error", "Failed to load group information");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleRemoveMember = (memberId, memberName) => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    Alert.alert(
      "Remove Member",
      `Remove ${memberName} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!group) return;
            const updatedMembers = group.members.filter((uid) => uid !== memberId);
            try {
              await db.collection("groups").doc(groupId).update({
                members: updatedMembers,
              });
              setMembers((prev) => prev.filter((m) => m.id !== memberId));
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async () => {
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    Alert.alert("Delete Group", "Are you sure? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await db.collection("groups").doc(groupId).delete();
            navigation.goBack();
          } catch (error) {
            console.error("Error deleting group:", error);
            Alert.alert("Error", "Failed to delete group");
          }
        },
      },
    ]);
  };

  const handleExitGroup = async () => {
    if (!currentUser || !group) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    const updatedMembers = group.members.filter((uid) => uid !== currentUser.uid);

    try {
      if (group.admin === currentUser.uid) {
        if (group.members.length === 1) {
          // If admin is the only member, delete the group
          await db.collection("groups").doc(groupId).delete();
        } else {
          // Transfer admin to another member
          const newAdmin = updatedMembers[0];
          await db.collection("groups").doc(groupId).update({
            admin: newAdmin,
            members: updatedMembers,
          });
        }
      } else {
        // Regular member leaving
        await db.collection("groups").doc(groupId).update({
          members: updatedMembers,
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error exiting group:", error);
      Alert.alert("Error", "Failed to exit group");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Loading group info...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Group not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAdmin = currentUser?.uid === group.admin;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👥</Text>
        </View>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{members.length} members</Text>
        <Text style={styles.createdDate}>
          Created {group.createdAt?.toDate?.()?.toLocaleDateString() || "recently"}
        </Text>
      </View>

      {/* Members List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members</Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          style={styles.membersList}
          renderItem={({ item }) => {
            const isMemberAdmin = item.id === group.admin;
            const isCurrentUser = item.id === currentUser?.uid;
            
            return (
              <View style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.name?.[0]?.toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={[
                      styles.memberName,
                      isCurrentUser && styles.currentUserText
                    ]}>
                      {item.name} {isCurrentUser && "(You)"}
                    </Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                </View>
                
                <View style={styles.memberActions}>
                  {isMemberAdmin && (
                    <Text style={styles.adminBadge}>Admin</Text>
                  )}
                  {isAdmin && !isMemberAdmin && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item.id, item.name)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Bottom Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleExitGroup}
          style={[styles.button, styles.exitButton]}
        >
          <Text style={styles.buttonText}>Exit Group</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            onPress={handleDeleteGroup}
            style={[styles.button, styles.deleteButton]}
          >
            <Text style={styles.buttonText}>Delete Group</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    backgroundColor: "#25D366",
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
    textAlign: "center",
  },
  memberCount: {
    fontSize: 16,
    color: "gray",
    marginBottom: 5,
  },
  createdDate: {
    fontSize: 14,
    color: "#999",
  },
  section: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  membersList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  memberName: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  currentUserText: {
    color: "#25D366",
  },
  memberEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadge: {
    backgroundColor: "#007AFF",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  exitButton: {
    backgroundColor: "#FF9500",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default GroupInfoScreen;