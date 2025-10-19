import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { db, authService } from "../../utils/firebaseConfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import firestore from "@react-native-firebase/firestore";

export default function SelectGroupsScreen({ route, navigation }) {
  const { communityId } = route.params;
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const currentUser = authService.currentUser;

  // 🆕 FIXED: Separate useEffect hooks for better cleanup
  useEffect(() => {
    if (!currentUser?.uid) return;

    const checkCommunityAdmin = async () => {
      try {
        const communityDoc = await firestore()
          .collection("communities")
          .doc(communityId)
          .get();
        
        const communityData = communityDoc.data();
        if (communityData && communityData.admin !== currentUser.uid) {
          Alert.alert("Access Denied", "Only community admin can add groups");
          navigation.goBack();
          return false;
        }
        setIsAdmin(true);
        return true;
      } catch (error) {
        console.error("Error checking admin status:", error);
        Alert.alert("Error", "Failed to verify permissions");
        navigation.goBack();
        return false;
      }
    };

    checkCommunityAdmin();
  }, [currentUser?.uid, communityId]);

  // 🆕 FIXED: Separate useEffect for groups subscription
  useEffect(() => {
    if (!currentUser?.uid || !isAdmin) return;

    const unsubscribe = firestore()
      .collection('groups')
      .where('admin', '==', currentUser.uid)
      .where('isCommunityGroup', '!=', true)
      .onSnapshot(
        snapshot => {
          const groupsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGroups(groupsData);
          setLoading(false);
        },
        error => {
          console.error("Error fetching admin groups:", error);
          setLoading(false);
        }
      );

    // 🆕 FIXED: Proper cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid, isAdmin]);

  const toggleGroupSelection = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const addGroupsToCommunity = async () => {
    if (selectedGroups.length === 0) {
      Alert.alert("Error", "Please select at least one group");
      return;
    }

    setLoading(true);

    try {
      for (const groupId of selectedGroups) {
        const groupDoc = await firestore().collection("groups").doc(groupId).get();
        const groupData = groupDoc.data();

        if (groupData) {
          // 🆕 CHECK IF GROUP IS ALREADY IN A COMMUNITY
          if (groupData.communityId) {
            Alert.alert("Error", `Group "${groupData.name}" is already in another community`);
            setLoading(false);
            return;
          }

          // Update group to be part of community
          await firestore().collection("groups").doc(groupId).update({
            communityId: communityId,
            isCommunityGroup: true,
          });

          // Add to community's groups subcollection
          await firestore()
            .collection("communities")
            .doc(communityId)
            .collection("groups")
            .add({
              name: groupData.name,
              groupId: groupId,
              description: groupData.description || `Group for ${groupData.name}`,
              isAnnouncement: false,
              lastMessage: groupData.lastMessage || "Group added to community",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              createdAt: firestore.FieldValue.serverTimestamp(),
              members: groupData.members || [],
              createdBy: groupData.createdBy || currentUser.uid,
              admin: groupData.admin || currentUser.uid,
              isCommunityGroup: true,
              communityId: communityId,
            });
        }
      }

      setLoading(false);
      Alert.alert("Success", `${selectedGroups.length} group(s) added to community`, [
        {
          text: "OK",
          onPress: () => navigation.navigate('CommunityScreen')
        }
      ]);
      
    } catch (error) {
      console.error("Error adding groups to community:", error);
      Alert.alert("Error", "Failed to add groups to community");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text>Loading your groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
      <TouchableOpacity 
  onPress={() => navigation.goBack()} 
  style={styles.backButton}
>
  <Icon name="arrow-back" size={24} color="#000" />
</TouchableOpacity>
        <Text style={styles.headerTitle}>Add Existing Groups</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Instructions */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Select Groups to Add</Text>
        <Text style={styles.infoText}>
          Choose from groups where you are an admin.
        </Text>
        {/* 🆕 ADD ADMIN BADGE */}
        {/* <View style={styles.adminBadge}> */}
          {/* <Icon name="admin-panel-settings" size={16} color="#FFD700" /> */}
          {/* <Text style={styles.adminBadgeText}>You are the community admin</Text> */}
        {/* </View> */}
      </View>

      {/* Groups List */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        style={styles.groupsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.groupItem,
              selectedGroups.includes(item.id) && styles.groupItemSelected
            ]}
            onPress={() => toggleGroupSelection(item.id)}
            disabled={item.communityId}
          >
            <View style={styles.groupInfo}>
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>
                  {item.name?.[0]?.toUpperCase() || "G"}
                </Text>
              </View>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMembers}>
                  {item.members?.length || 1} members
                </Text>
                {item.communityId && (
                  <Text style={styles.alreadyInCommunity}>
                    ⚠️ Already in another community
                  </Text>
                )}
              </View>
            </View>
            
            <View style={[
              styles.checkbox,
              selectedGroups.includes(item.id) && styles.checkboxSelected,
              item.communityId && styles.checkboxDisabled
            ]}>
              {selectedGroups.includes(item.id) && (
                <Icon name="check" size={16} color="#fff" />
              )}
              {item.communityId && (
                <Icon name="block" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="group" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No groups available</Text>
            <Text style={styles.emptySubtext}>
              You don't have any groups where you're an admin, or all your groups are already in communities.
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      {groups.length > 0 && (
        <TouchableOpacity
          style={[
            styles.addButton,
            (selectedGroups.length === 0 || loading) && styles.addButtonDisabled
          ]}
          onPress={addGroupsToCommunity}
          disabled={selectedGroups.length === 0 || loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? "Adding..." : `Add ${selectedGroups.length} Group(s) to Community`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backButton: {
    marginTop: 20, // Add top margin here
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "400",
    marginTop: 20,
    marginLeft: 12, // Add some left margin to separate from back button
    flex: 1, // This makes the title take available space and push to left

  },
  infoBox: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2C",
    padding: 8,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  groupsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  groupItemSelected: {
    backgroundColor: "#f0f8f0",
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  groupAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: "#666",
  },
  alreadyInCommunity: {
    fontSize: 12,
    color: "#ff3b30",
    fontStyle: "italic",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  checkboxDisabled: {
    backgroundColor: "#ccc",
    borderColor: "#ccc",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#25D366",
    paddingVertical: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});