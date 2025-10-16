import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { authService, db } from "../../utils/firebaseConfig";
import theme from "../../core/utils/theme";

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAdminTransferModal, setShowAdminTransferModal] = useState(false);
  
  const currentUser = authService.currentUser;

  useEffect(() => {
    if (!groupId) {
      Alert.alert("Error", "Group ID not provided");
      setLoading(false);
      return;
    }

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

  // Fetch available users to add to group
  const fetchAvailableUsers = async () => {
    try {
      const usersSnapshot = await db.collection("users").get();
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out users who are already members
      const available = allUsers.filter(user => 
        !group.members.includes(user.id) && user.id !== currentUser?.uid
      );
      
      setAvailableUsers(available);
      setShowAddMembersModal(true);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to load available users");
    }
  };

  // Add member to group
  const handleAddMember = async (user) => {
    try {
      const updatedMembers = [...group.members, user.id];
      await db.collection("groups").doc(groupId).update({
        members: updatedMembers,
      });
      setShowAddMembersModal(false);
      Alert.alert("Success", `${user.name} added to the group`);
    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error", "Failed to add member to group");
    }
  };

  // Make member admin
  const handleMakeAdmin = (member) => {
    Alert.alert(
      "Make Admin",
      `Make ${member.name} the group admin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Make Admin",
          onPress: async () => {
            try {
              await db.collection("groups").doc(groupId).update({
                admin: member.id,
              });
              Alert.alert("Success", `${member.name} is now the group admin`);
            } catch (error) {
              console.error("Error transferring admin:", error);
              Alert.alert("Error", "Failed to transfer admin role");
            }
          },
        },
      ]
    );
  };

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

    const isAdmin = currentUser.uid === group.admin;
    const updatedMembers = group.members.filter((uid) => uid !== currentUser.uid);

    if (isAdmin && updatedMembers.length > 0) {
      // Admin leaving - prompt to transfer admin or delete group
      Alert.alert(
        "You are the Admin",
        "Please choose someone else as admin before leaving, or delete the group.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Transfer Admin",
            onPress: () => setShowAdminTransferModal(true),
          },
          {
            text: "Delete Group",
            style: "destructive",
            onPress: handleDeleteGroup,
          },
        ]
      );
    } else if (isAdmin && updatedMembers.length === 0) {
      // Admin is the only member - delete group
      handleDeleteGroup();
    } else {
      // Regular member leaving
      Alert.alert(
        "Exit Group",
        "Are you sure you want to leave this group?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Exit",
            style: "destructive",
            onPress: async () => {
              try {
                await db.collection("groups").doc(groupId).update({
                  members: updatedMembers,
                });
                navigation.goBack();
              } catch (error) {
                console.error("Error exiting group:", error);
                Alert.alert("Error", "Failed to exit group");
              }
            },
          },
        ]
      );
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
  const otherMembers = members.filter(member => member.id !== currentUser?.uid);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons style={styles.people} name="people-outline" size={48} color="#000" />
        </View>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{members.length} members</Text>
        <Text style={styles.createdDate}>
          Created {group.createdAt?.toDate?.()?.toLocaleDateString() || "recently"}
        </Text>
      </View>

      {/* Admin Action Buttons */}
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={fetchAvailableUsers}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.adminButtonText}>Add Members</Text>
          </TouchableOpacity>
        </View>
      )}

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
                    <View style={styles.adminControls}>
                      <TouchableOpacity
                        onPress={() => handleMakeAdmin(item)}
                        style={styles.makeAdminButton}
                      >
                        <Text style={styles.makeAdminButtonText}>Make Admin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(item.id, item.name)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Add Members Modal */}
      <Modal
        visible={showAddMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Members to Group</Text>
            <FlatList
              data={availableUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleAddMember(item)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.name?.[0]?.toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color="#25D366" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No users available to add</Text>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddMembersModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Admin Transfer Modal */}
      <Modal
        visible={showAdminTransferModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdminTransferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transfer Admin Role</Text>
            <Text style={styles.modalSubtitle}>Select a new admin for the group:</Text>
            <FlatList
              data={otherMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={async () => {
                    try {
                      // Transfer admin and remove current user
                      await db.collection("groups").doc(groupId).update({
                        admin: item.id,
                        members: group.members.filter(uid => uid !== currentUser.uid),
                      });
                      setShowAdminTransferModal(false);
                      navigation.goBack();
                    } catch (error) {
                      console.error("Error transferring admin:", error);
                      Alert.alert("Error", "Failed to transfer admin role");
                    }
                  }}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.name?.[0]?.toUpperCase() || "U"}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                  </View>
                  <Ionicons name="shield-outline" size={24} color="#25D366" />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAdminTransferModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  people: {
    marginTop: 55,
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
    backgroundColor: "#fff",
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
  // Admin Actions
  adminActions: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    padding: 12,
    borderRadius: 8,
  },
  adminButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
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
  adminControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadge: {
    backgroundColor: "#fff",
    color: "#25d366",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "500",
  },
  makeAdminButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  makeAdminButtonText: {
    color: "#25d366",
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#ff3b30",
    fontSize: 12,
    fontWeight: "500",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: 20,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#25D366",
    fontWeight: "bold",
    fontSize: 16,
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
    backgroundColor: "#25d366",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default GroupInfoScreen;