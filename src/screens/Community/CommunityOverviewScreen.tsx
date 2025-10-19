// CommunityOverviewScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  FlatList,
  Modal,
  ActivityIndicator
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
  const [members, setMembers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showAdminTransferModal, setShowAdminTransferModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!id) return;

    // Fetch community data
    const unsubscribeCommunity = firestore()
      .collection('communities')
      .doc(id)
      .onSnapshot(async (doc) => {
        if (doc.exists) {
          const communityData = { id: doc.id, ...doc.data() };
          setCommunity(communityData);
          
          // Check if current user is admin
          setIsAdmin(communityData.admin === currentUser?.uid);

          // Fetch member details
          if (communityData.members && Array.isArray(communityData.members)) {
            try {
              const memberDocs = await Promise.all(
                communityData.members.map(async (uid: string) => {
                  const userDoc = await firestore().collection('users').doc(uid).get();
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
            }
          }
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
        setLoading(false);
      });

    return () => {
      unsubscribeCommunity();
      unsubscribeGroups();
    };
  }, [id, currentUser?.uid]);

  // Fetch available users to add to community
  // const fetchAvailableUsers = async () => {
  //   try {
  //     const usersSnapshot = await firestore().collection('users').get();
  //     const allUsers = usersSnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       ...doc.data()
  //     }));
      
  //     // Filter out users who are already members
  //     const available = allUsers.filter(user => 
  //       !community.members.includes(user.id) && user.id !== currentUser?.uid
  //     );
      
  //     setAvailableUsers(available);
  //     setShowAddMembersModal(true);
  //     setShowMenu(false);
  //   } catch (error) {
  //     console.error("Error fetching users:", error);
  //     Alert.alert("Error", "Failed to load available users");
  //   }
  // };
// In CommunityOverviewScreen.tsx - Fix the handleAddMember function
const handleAddMember = async (user: any) => {
  try {
    console.log("Adding user to community:", user);
    
    // 1. Add to community members
    const updatedMembers = [...community.members, user.id];
    await firestore().collection('communities').doc(id).update({
      members: updatedMembers,
    });

    console.log("Added to community members");

    // 2. Add to all groups in the community with proper error handling
    const groupUpdatePromises = groups.map(async (group) => {
      try {
        const groupId = group.groupId || group.id;
        console.log("Processing group:", groupId, group.name);
        
        const groupDoc = await firestore().collection('groups').doc(groupId).get();
        
        if (groupDoc.exists) {
          const groupData = groupDoc.data();
          const groupMembers = groupData?.members || [];
          
          // Check if user is already in the group
          if (!groupMembers.includes(user.id)) {
            const updatedGroupMembers = [...groupMembers, user.id];
            
            await firestore()
              .collection('groups')
              .doc(groupId)
              .update({
                members: updatedGroupMembers
              });
            
            console.log(`Added to group: ${group.name}`);
          } else {
            console.log(`User already in group: ${group.name}`);
          }
        } else {
          console.warn(`Group document not found: ${groupId}`);
        }
      } catch (groupError) {
        console.error(`Error adding to group ${group.name}:`, groupError);
        // Continue with other groups even if one fails
      }
    });

    await Promise.all(groupUpdatePromises);
    
    setShowAddMembersModal(false);
    Alert.alert("Success", `${user.name} added to the community and all groups`);
    
  } catch (error) {
    console.error("Error adding member:", error);
    Alert.alert("Error", "Failed to add member to community");
  }
};

// Also fix the fetchAvailableUsers function to handle errors better
const fetchAvailableUsers = async () => {
  try {
    console.log("Fetching available users...");
    
    const usersSnapshot = await firestore().collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log("Total users found:", allUsers.length);
    
    // Filter out users who are already members
    const available = allUsers.filter(user => {
      const isAlreadyMember = community.members.includes(user.id);
      const isCurrentUser = user.id === currentUser?.uid;
      
      if (isAlreadyMember) {
        console.log(`Filtering out ${user.name} - already a member`);
      }
      if (isCurrentUser) {
        console.log(`Filtering out ${user.name} - current user`);
      }
      
      return !isAlreadyMember && !isCurrentUser;
    });
    
    console.log("Available users after filtering:", available.length);
    setAvailableUsers(available);
    setShowAddMembersModal(true);
    setShowMenu(false);
    
  } catch (error) {
    console.error("Error fetching users:", error);
    Alert.alert("Error", "Failed to load available users");
  }
};
  // Add member to community and all its groups
  // const handleAddMember = async (user: any) => {
  //   try {
  //     // 1. Add to community members
  //     const updatedMembers = [...community.members, user.id];
  //     await firestore().collection('communities').doc(id).update({
  //       members: updatedMembers,
  //     });

  //     // 2. Add to all groups in the community
  //     const groupUpdatePromises = groups.map(async (group) => {
  //       const groupId = group.groupId || group.id;
  //       const groupDoc = await firestore().collection('groups').doc(groupId).get();
        
  //       if (groupDoc.exists) {
  //         const groupData = groupDoc.data();
  //         const groupMembers = groupData?.members || [];
  //         const updatedGroupMembers = [...groupMembers, user.id];
          
  //         await firestore()
  //           .collection('groups')
  //           .doc(groupId)
  //           .update({
  //             members: updatedGroupMembers
  //           });
  //       }
  //     });

  //     await Promise.all(groupUpdatePromises);
      
  //     setShowAddMembersModal(false);
  //     Alert.alert("Success", `${user.name} added to the community and all groups`);
  //   } catch (error) {
  //     console.error("Error adding member:", error);
  //     Alert.alert("Error", "Failed to add member to community");
  //   }
  // };

  // Make member admin
  const handleMakeAdmin = (member: any) => {
    Alert.alert(
      "Make Admin",
      `Make ${member.name} the community admin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Make Admin",
          onPress: async () => {
            try {
              await firestore().collection('communities').doc(id).update({
                admin: member.id,
              });
              Alert.alert("Success", `${member.name} is now the community admin`);
              setShowMembersModal(false);
            } catch (error) {
              console.error("Error transferring admin:", error);
              Alert.alert("Error", "Failed to transfer admin role");
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      "Remove Member",
      `Remove ${memberName} from the community? They will be removed from all community groups.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!community) return;
            
            try {
              // 1. Remove from community
              const updatedMembers = community.members.filter((uid: string) => uid !== memberId);
              await firestore().collection('communities').doc(id).update({
                members: updatedMembers,
              });

              // 2. Remove from all community groups
              const groupUpdatePromises = groups.map(async (group) => {
                const groupId = group.groupId || group.id;
                const groupDoc = await firestore().collection('groups').doc(groupId).get();
                
                if (groupDoc.exists) {
                  const groupData = groupDoc.data();
                  const groupMembers = groupData?.members || [];
                  const updatedGroupMembers = groupMembers.filter((uid: string) => uid !== memberId);
                  
                  await firestore()
                    .collection('groups')
                    .doc(groupId)
                    .update({
                      members: updatedGroupMembers
                    });
                }
              });

              await Promise.all(groupUpdatePromises);
              Alert.alert("Success", `${memberName} removed from community`);
              
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handleAddGroup = () => {
    navigation.navigate('ManageGroupsScreen', { id });
  };

  const handleDeleteCommunity = async () => {
    Alert.alert(
      "Delete Community", 
      "Are you sure? This will delete the community and all its groups. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all groups first
              const groupDeletePromises = groups.map(async (group) => {
                const groupId = group.groupId || group.id;
                await firestore().collection('groups').doc(groupId).delete();
              });

              await Promise.all(groupDeletePromises);

              // Delete the community document
              await firestore().collection('communities').doc(id).delete();
              
              navigation.goBack();
              Alert.alert("Success", "Community deleted successfully");
              
            } catch (error) {
              console.error("Error deleting community:", error);
              Alert.alert("Error", "Failed to delete community");
            }
          },
        },
      ]
    );
  };

  // Function to transfer admin rights
  const transferAdminRights = async (member?: any) => {
    if (member) {
      // Transfer to specific member
      try {
        await firestore()
          .collection('communities')
          .doc(id)
          .update({
            admin: member.id
          });
        
        Alert.alert("Success", `Admin rights transferred to ${member.name}`);
        setShowAdminTransferModal(false);
      } catch (error) {
        console.error("Error transferring admin:", error);
        Alert.alert("Error", "Failed to transfer admin rights");
      }
    } else {
      // Show modal to select admin
      setShowAdminTransferModal(true);
      setShowMenu(false);
    }
  };

  // Exit Community (Leave but keep community for others)
  const handleExitCommunity = () => {
    setShowMenu(false);
    
    if (isAdmin) {
      const otherMembers = members.filter(member => member.id !== currentUser?.uid);
      
      if (otherMembers.length === 0) {
        // No other members - delete community
        handleDeleteCommunity();
      } else {
        Alert.alert(
          "Admin Cannot Exit",
          "Please transfer admin rights to another member before leaving, or delete the community.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Transfer Admin Rights",
              onPress: () => transferAdminRights()
            },
            {
              text: "Delete Community",
              style: "destructive",
              onPress: handleDeleteCommunity,
            },
          ]
        );
      }
      return;
    }

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading community...</Text>
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Community not found</Text>
      </View>
    );
  }

  // Separate groups
  const announcementsGroup = groups.find(g => g.isAnnouncement);
  const otherGroups = groups.filter(g => !g.isAnnouncement);
  const otherMembers = members.filter(member => member.id !== currentUser?.uid);

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
            <Text style={styles.subtitle}>Community · {groups.length} groups · {members.length} members</Text>
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
              {/* View Members */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMembersModal(true);
                  setShowMenu(false);
                }}
              >
                <Ionicons name="people-outline" size={18} color="#666" />
                <Text style={styles.menuText}>View Members</Text>
              </TouchableOpacity>

              {/* Only show Add Members for admin */}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={fetchAvailableUsers}
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
                <Text style={[styles.menuText, styles.exitText]}>
                  {isAdmin ? 'Transfer Admin & Exit' : 'Exit Community'}
                </Text>
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
        {/* Community Info Card */}
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

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{groups.length}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {community.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
              </Text>
              <Text style={styles.statLabel}>Created</Text>
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

        {/* Add Group Button - Only show for admin */}
        {isAdmin && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddGroup}>
            <Text style={styles.addButtonText}>+ Add group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Community Members</Text>
            <Text style={styles.modalSubtitle}>{members.length} members</Text>
            
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isMemberAdmin = item.id === community.admin;
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
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMembersModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        visible={showAddMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Members to Community</Text>
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
            <Text style={styles.modalSubtitle}>Select a new admin for the community:</Text>
            <FlatList
              data={otherMembers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => transferAdminRights(item)}
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
    color: "#000",

    paddingHorizontal: 6,
    paddingVertical: 2,


  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#25D366',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
});

export default CommunityOverviewScreen;