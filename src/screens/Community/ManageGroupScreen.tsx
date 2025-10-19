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
import Ionicons from "react-native-vector-icons/Ionicons";
import firestore from '@react-native-firebase/firestore';

export default function ManageGroupsScreen({ route, navigation }) {
  // Safe access to route params
  const { id } = route.params || {};
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if community ID exists
  if (!id) {
    return (
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Groups</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={50} color="#ff3b30" />
          <Text style={styles.errorText}>Community Information Missing</Text>
          <Text style={styles.errorSubtext}>
            The community ID was not provided. Please go back and try again.
          </Text>
          <TouchableOpacity 
            style={styles.backActionButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backActionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (!id) return;

    const unsubscribe = firestore()
      .collection('communities')
      .doc(id)
      .collection('groups')
      .onSnapshot(
        snapshot => {
          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGroups(list);
          setLoading(false);
          setError(null);
        },
        error => {
          console.error("Error fetching groups:", error);
          setError("Failed to load groups");
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [id]);

  const createNewGroup = () => {
    // Navigate to SelectMembersScreen to start the group creation flow
    navigation.navigate('SelectMembersScreen', { 
      communityId: id,
      nextScreen: 'GroupCreationScreen'
    });
  };

  const addExistingGroup = () => {
    // Navigate to SelectGroupsScreen to choose existing groups
    navigation.navigate('SelectGroupsScreen', { 
      communityId: id 
    });
  };

  const deleteGroup = async (groupId, groupName, isAnnouncement) => {
    // Prevent deletion of Announcement and General groups
    if (isAnnouncement || groupName === "General") {
      Alert.alert(
        "Cannot Delete", 
        `${groupName} is a default group and cannot be deleted.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Delete group", 
      `Are you sure you want to delete "${groupName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore()
                .collection('communities')
                .doc(id)
                .collection('groups')
                .doc(groupId)
                .delete();
            } catch (e) {
              console.error("Error deleting group:", e);
              Alert.alert("Error", "Failed to delete group. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Groups</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00a884" size="large" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Groups</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorStateContainer}>
          <Icon name="wifi-off" size={50} color="#ff9500" />
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Groups</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Subheader */}
        <View style={styles.subHeaderContainer}>
          <Text style={styles.subHeader}>
            {groups.length} group{groups.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Action Buttons */}
        {/* Action Buttons */}
<View style={styles.actionsContainer}>
  <TouchableOpacity style={styles.actionRow} onPress={createNewGroup}>
    <View style={styles.actionIcon}>
      <Icon name="account-group" size={22} color="#fff" />
    </View>
    <Text style={styles.actionText}>Create New Group</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.actionRow} onPress={addExistingGroup}>
    <View style={[styles.actionIcon]}>
      <Ionicons name="add" size={22} color="#fff" />
    </View>
    <Text style={styles.actionText}>Add Existing Groups</Text>
  </TouchableOpacity>
</View>

        {/* Groups List */}
        <View style={styles.groupsContainer}>
          <Text style={styles.sectionTitle}>Groups in this Community</Text>
          
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isDefaultGroup = item.isAnnouncement || item.name === "General";
              
              return (
                <View style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <Icon
                      name={item.isAnnouncement ? "bullhorn" : "chat-outline"}
                      size={22}
                      color="#333"
                    />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupSub}>
                      {item.isAnnouncement ? "Announcement Group" : "Discussion Group"}
                      {isDefaultGroup && " • Default"}
                    </Text>
                  </View>
                  {/* Only show delete button for non-default groups */}
                  {!isDefaultGroup && (
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteGroup(item.id, item.name, item.isAnnouncement)}
                    >
                      <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="account-group-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No groups yet</Text>
                <Text style={styles.emptySubtext}>
                  Create your first group to get started
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "400",
    color: "#000",
    textAlign: "left",
    flex: 1,
    marginTop: 24,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  subHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  subHeader: { 
    color: "#666", 
    fontSize: 14,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12,
    paddingVertical: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00a884",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionText: { 
    fontSize: 16, 
    fontWeight: "500",
    color: "#000",
  },
  infoText: {
    color: "#666",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 15,
    borderRadius: 8,
    marginTop: 5,
  },
  linkText: {
    color: "#1a73e8",
    fontWeight: "500",
  },
  groupsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f3f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: { 
    fontSize: 16, 
    fontWeight: "500",
    color: "#000",
  },
  groupSub: { 
    fontSize: 13, 
    color: "#666",
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 10,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  errorStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  backActionButton: {
    backgroundColor: '#00a884',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});