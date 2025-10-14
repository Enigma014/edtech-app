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
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={50} color="#ff3b30" />
          <Text style={styles.errorText}>Community Information Missing</Text>
          <Text style={styles.errorSubtext}>
            The community ID was not provided. Please go back and try again.
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
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

  const deleteGroup = async (groupId, groupName) => {
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#00a884" size="large" />
        <Text style={styles.loadingText}>Loading groups...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
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
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Manage Groups</Text>
        <Text style={styles.subHeader}>
          {groups.length} group{groups.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionRow} onPress={createNewGroup}>
          <View style={styles.actionIcon}>
            <Icon name="account-group" size={22} color="#fff" />
          </View>
          <Text style={styles.actionText}>Create New Group</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={addExistingGroup}>
          <View style={[styles.actionIcon, { backgroundColor: "#34c759" }]}>
            <Icon name="plus" size={22} color="#fff" />
          </View>
          <Text style={styles.actionText}>Add Existing Groups</Text>
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>
        Members can suggest existing groups for admin approval and add new groups directly.{" "}
        <Text style={styles.linkText}>View in Community settings</Text>
      </Text>

      {/* Groups List */}
      <View style={styles.groupsContainer}>
        <Text style={styles.sectionTitle}>Groups in this Community</Text>
        
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
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupSub}>
                  {item.isAnnouncement ? "Announcement Group" : "Discussion Group"}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteGroup(item.id, item.name)}
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
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
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
  },
  headerContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  header: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#000",
  },
  subHeader: { 
    color: "#666", 
    fontSize: 14,
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
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
    paddingHorizontal: 15,
    paddingTop: 15,
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
  backButton: {
    backgroundColor: '#00a884',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
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