// CommunityOverviewScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

type CommunityOverviewScreenProps = {
  communityName?: string;
  navigation: StackNavigationProp<any>;
  route: any;
};

const CommunityOverviewScreen: React.FC<CommunityOverviewScreenProps> = ({ 
  communityName = "Community",
  navigation,
  route
}) => {
  const { id } = route.params || {};
  const [community, setCommunity] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const currentUser = auth().currentUser;

  console.log("CommunityOverview received communityId:", id);

  useEffect(() => {
    if (!id) return;

    // Fetch community data
    const unsubscribeCommunity = firestore()
      .collection('communities')
      .doc(id)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const communityData = { id: doc.id, ...doc.data() };
          setCommunity(communityData);
          
          // Check if current user is admin
          setIsAdmin(communityData.admin === currentUser?.uid);
        }
      });

    // Fetch groups for this community
    const unsubscribeGroups = firestore()
      .collection('communities')
      .doc(id)
      .collection('groups')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsData);
      });

    return () => {
      unsubscribeCommunity();
      unsubscribeGroups();
    };
  }, [id, currentUser?.uid]);

  const handleAddGroup = () => {
    navigation.navigate('ManageGroupsScreen', { id });
  };

  const handleAddMembers = () => {
    setShowMenu(false);
    navigation.navigate('SelectMembersScreen', { 
      communityId: id,
      communityName: community?.name 
    });
  };

  // Exit Community (Leave but keep community for others)
  const handleExitCommunity = () => {
    setShowMenu(false);
    
    Alert.alert(
      "Exit Community",
      "Are you sure you want to leave this community? You will no longer be able to send messages in any of the community groups.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove user from community members
              const updatedMembers = community.members.filter(
                (memberId: string) => memberId !== currentUser?.uid
              );

              await firestore()
                .collection('communities')
                .doc(id)
                .update({
                  members: updatedMembers
                });

              // Remove user from all community groups
              const groupUpdates = groups.map(async (group) => {
                const groupDoc = await firestore()
                  .collection('groups')
                  .doc(group.groupId || group.id)
                  .get();
                
                if (groupDoc.exists) {
                  const groupData = groupDoc.data();
                  const updatedGroupMembers = groupData?.members?.filter(
                    (memberId: string) => memberId !== currentUser?.uid
                  ) || [];

                  await firestore()
                    .collection('groups')
                    .doc(group.groupId || group.id)
                    .update({
                      members: updatedGroupMembers
                    });
                }
              });

              await Promise.all(groupUpdates);
              
              Alert.alert("Success", "You have left the community");
              navigation.goBack();
            } catch (error) {
              console.error("Error exiting community:", error);
              Alert.alert("Error", "Failed to exit community");
            }
          }
        }
      ]
    );
  };

  // Exit and Delete Community (Remove community completely)
  const handleExitAndDeleteCommunity = () => {
    setShowMenu(false);
    
    if (!isAdmin) {
      Alert.alert(
        "Delete Community",
        "Are you sure you want to delete this community? This action cannot be undone and all groups will be lost.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete the community document
                await firestore()
                  .collection('communities')
                  .doc(id)
                  .delete();

                // Delete all groups in this community
                const groupDeletions = groups.map(async (group) => {
                  await firestore()
                    .collection('groups')
                    .doc(group.groupId || group.id)
                    .delete();
                });

                await Promise.all(groupDeletions);
                
                Alert.alert("Success", "Community deleted successfully");
                navigation.goBack();
              } catch (error) {
                console.error("Error deleting community:", error);
                Alert.alert("Error", "Failed to delete community");
              }
            }
          }
        ]
      );
    } else {
      Alert.alert(
        "Admin Restriction",
        "As the community admin, you cannot delete the community while you're still a member. Please transfer admin rights first or use 'Exit' to leave the community.",
        [{ text: "OK" }]
      );
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return "Recently";
    }
  };

  if (!community) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading community...</Text>
      </View>
    );
  }

  // Separate groups
  const announcementsGroup = groups.find(g => g.isAnnouncement);
  const otherGroups = groups.filter(g => !g.isAnnouncement);

  return (
    <View style={styles.container}>
      {/* Header with Three-Dot Menu */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.subtitle}>Community · {groups.length} groups</Text>
          </View>

          {/* Three-Dot Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>

          {/* Menu Options */}
          {showMenu && (
            <View style={styles.menuOptions}>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleAddMembers}
                >
                  <Ionicons name="person-add-outline" size={18} color="#666" />
                  <Text style={styles.menuText}>Add Members</Text>
                </TouchableOpacity>
              )}
              
              {/* Exit Option - Available for all members */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleExitCommunity}
              >
                <Ionicons name="exit-outline" size={18} color="#ff6b6b" />
                <Text style={[styles.menuText, styles.exitText]}>Exit Community</Text>
              </TouchableOpacity>

              {/* Exit and Delete Option - Available for non-admins only */}
              {!isAdmin && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleExitAndDeleteCommunity}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                  <Text style={[styles.menuText, styles.exitText]}>Exit and Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  // Add more options here if needed
                }}
              >
                <Ionicons name="settings-outline" size={18} color="#666" />
                <Text style={styles.menuText}>Community Settings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        />
      )}

      <ScrollView style={styles.scrollContent}>
        {/* Community Card */}
        <View style={styles.communityCard}>
          <View style={styles.communityHeader}>
            <Ionicons name="people-outline" size={28} color="#000" />
            <View style={styles.communityTitleContainer}>
              <Text style={styles.cardCommunityName}>
                {community.name}
              </Text>
              {isAdmin && (
                <Text style={styles.adminBadge}>ADMIN</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Announcements Group */}
          {announcementsGroup && (
            <TouchableOpacity
              style={styles.groupItem}
              onPress={() =>
                navigation.navigate("ChatDetailScreen", {
                  chatId: announcementsGroup.groupId || announcementsGroup.id,
                  name: `${community.name} - Announcements`,
                  isGroup: true,
                  isCommunity: true,
                  communityId: id,
                  isAnnouncements: true,
                })
              }
            >
              <View style={[styles.groupIcon, { backgroundColor: "#d4f8d4" }]}>
                <Ionicons name="megaphone-outline" size={18} color="#000" />
              </View>

              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>Announcements</Text>
                <Text style={styles.groupMessage} numberOfLines={1}>
                  {announcementsGroup.lastMessage || "Community announcements"}
                </Text>
              </View>

              <View style={styles.groupDateContainer}>
                <Text style={styles.groupDate}>
                  {formatDate(announcementsGroup.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Other Groups */}
          {otherGroups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupItem}
              onPress={() =>
                navigation.navigate("ChatDetailScreen", {
                  chatId: group.groupId || group.id,
                  name: `${community.name} - ${group.name}`,
                  isGroup: true,
                  isCommunity: true,
                  communityId: id,
                })
              }
            >
              <View style={[styles.groupIcon, { backgroundColor: "#e6e6e6" }]}>
                <Ionicons name="people-outline" size={18} color="#000" />
              </View>

              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMessage} numberOfLines={1}>
                  {group.lastMessage || "Group chat"}
                </Text>
              </View>

              <View style={styles.groupDateContainer}>
                <Text style={styles.groupDate}>
                  {formatDate(group.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty State */}
          {groups.length === 0 && (
            <View style={styles.emptyGroupsContainer}>
              <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
              <Text style={styles.emptyGroupsText}>
                No groups in this community yet
              </Text>
              {isAdmin && (
                <Text style={styles.adminHintText}>
                  Tap "Add group" to create the first group
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Add Group Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddGroup}>
          <Text style={styles.addButtonText}>+ Add group</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuOptions: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  exitText: {
    color: '#ff6b6b',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  scrollContent: {
    flex: 1,
    padding: 10,
  },
  communityCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 12,
  },
  cardCommunityName: {
    fontSize: 18,
    fontWeight: "600",
  },
  adminBadge: {
    fontSize: 10,
    color: "#FFD700",
    backgroundColor: "#2C2C2C",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: "bold"
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    marginRight: 8,
  },
  groupName: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 2,
  },
  groupMessage: {
    color: "#666",
    fontSize: 14,
  },
  groupDateContainer: {
    minWidth: 70,
    alignItems: "flex-end",
  },
  groupDate: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  emptyGroupsContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyGroupsText: {
    color: "#666",
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  adminHintText: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '500',
    marginTop: 4,
  },
  addButton: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CommunityOverviewScreen;