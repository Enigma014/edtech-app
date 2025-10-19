import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Navbar from "../../components/Navbar";
import Ionicons from "react-native-vector-icons/Ionicons";
import { db } from "../../utils/firebaseConfig";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { StyleSheet } from 'react-native';


const Community = ({ navigation }: { navigation: any }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    console.log("🔐 [SECURITY] Fetching communities for user:", currentUser.uid);
    
    const unsubscribe = db
      .collection("communities")
      .where("members", "array-contains", currentUser.uid)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) {
            console.warn("No snapshot returned from Firestore");
            setLoading(false);
            return;
          }
  
          const communitiesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          console.log("📋 [DEBUG] User can see", communitiesData.length, "communities");
          setCommunities(communitiesData);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching user communities:", error);
          if (error.message.includes('index')) {
            console.log("📝 Firestore index required. Using fallback method...");
            fetchCommunitiesFallback();
          } else {
            setLoading(false);
          }
        }
      );
  
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid]);

  const fetchCommunitiesFallback = async () => {
    try {
      console.log("🔄 Using fallback method to fetch communities");
      const snapshot = await db.collection("communities").get();
      
      const allCommunities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userCommunities = allCommunities.filter(community => 
        Array.isArray(community.members) && 
        community.members.includes(currentUser.uid)
      );

      console.log("📋 [FALLBACK] User can see", userCommunities.length, "out of", allCommunities.length, "communities");
      
      setCommunities(userCommunities);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error in fallback method:", error);
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    try {
      await firestore()
        .collection("communities")
        .doc(communityId)
        .delete();
      
      setCommunities(prev => prev.filter(community => community.id !== communityId));
      
      console.log("✅ Community deleted successfully:", communityId);
    } catch (error) {
      console.error("❌ Error deleting community:", error);
      throw error;
    }
  };

  const formatDate = (timestamp) => {
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
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Loading your communities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* CREATE COMMUNITY CARD */}
        <View style={styles.createCommunityCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Communities</Text>
          </View>

          {/* New Community Button */}
          <TouchableOpacity
            style={styles.newCommunityButton}
            onPress={() => navigation.navigate("CreateCommunityScreen")}
          >
            <View style={styles.communityIconContainer}>
              <View style={styles.communityIcon}>
                <Ionicons name="people-outline" size={26} color="#000" />
              </View>

              {/* Small green + icon overlay */}
              <View style={styles.addIconOverlay}>
                <Ionicons name="add" size={14} color="#fff" />
              </View>
            </View>

            <View style={styles.newCommunityTextContainer}>
              <Text style={styles.newCommunityTitle}>New Community</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Your Communities Section */}
        {communities.length > 0 && (
          <View style={styles.communitiesSection}>
            {communities.map((community) => (
              <CommunityCard 
                key={community.id} 
                community={community} 
                navigation={navigation} 
                formatDate={formatDate}
                currentUser={currentUser}
                onDeleteCommunity={handleDeleteCommunity}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {communities.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="people-outline" size={40} color="#25D366" />
            </View>
            <Text style={styles.emptyStateTitle}>Welcome to Communities!</Text>
            <Text style={styles.emptyStateDescription}>
              Communities bring people together around shared interests.{"\n"}
              Create your first community to get started.
            </Text>
            
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => navigation.navigate("CreateCommunityScreen")}
            >
              <Icon name="add" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.createFirstButtonText}>Create Your First Community</Text>
            </TouchableOpacity>
            
            <Text style={styles.emptyStateHint}>
              You'll be the admin and can add groups and members
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navbar */}
      <Navbar navigation={navigation} />
    </View>
  );
};

const CommunityCard = ({ community, navigation, formatDate, currentUser, onDeleteCommunity }) => {
  const [communityGroups, setCommunityGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!community?.id || !currentUser?.uid) return;

    const checkAdminStatus = async () => {
      try {
        const communityDoc = await firestore()
          .collection("communities")
          .doc(community.id)
          .get();
        
        const communityData = communityDoc.data();
        const userIsAdmin = communityData?.admin === currentUser.uid;
        
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();

    const unsubscribe = db
      .collection("communities")
      .doc(community.id)
      .collection("groups")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) return;
          
          const groupsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          setCommunityGroups(groupsData);
          setGroupsLoading(false);
        },
        (error) => {
          console.error(`❌ Error fetching groups for ${community.name}:`, error);
          setGroupsLoading(false);
        }
      );
  
    return () => unsubscribe?.();
  }, [community.id, currentUser?.uid]);

  const deleteCommunity = async () => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "Only community admin can delete the community");
      return;
    }

    Alert.alert(
      "Delete Community",
      `Are you sure you want to delete "${community.name}"? This action cannot be undone and all groups will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              setShowMenu(false);
              
              await onDeleteCommunity(community.id);
            } catch (error) {
              console.error("Error deleting community:", error);
              Alert.alert("Error", "Failed to delete community. Please try again.");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const getDisplayGroups = () => {
    const announcementsGroup = communityGroups.find(g => g.isAnnouncement);
    const generalGroup = communityGroups.find(g => !g.isAnnouncement && g.name === "General");
    const otherGroups = communityGroups.filter(g => !g.isAnnouncement && g.name !== "General");

    const priorityGroups = [announcementsGroup, generalGroup].filter(Boolean);
    
    if (showAllGroups) {
      return [...priorityGroups, ...otherGroups];
    } else {
      return [...priorityGroups, ...otherGroups.slice(0, 2 - priorityGroups.length)];
    }
  };

  const displayGroups = getDisplayGroups();
  const hasMoreGroups = communityGroups.length > displayGroups.length;

  return (
    <View style={styles.communityCard}>
      {/* Community Header with 3-dot menu */}
      <View style={styles.communityHeader}>
        <TouchableOpacity 
          style={styles.communityTitle}
          onPress={() => navigation.navigate("CommunityOverviewScreen", { id: community.id })}
        >
          <Ionicons name="people-outline" size={28} color="#000" />
          <View style={styles.communityTitleContainer}>
            <Text style={styles.communityName}>{community.name}</Text>
          </View>
        </TouchableOpacity>

        {/* 3-DOT MENU */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          )}
        </TouchableOpacity>

        {/* MENU OPTIONS */}
        {showMenu && (
          <View style={styles.menuOptions}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={deleteCommunity}
              >
                <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                <Text style={styles.deleteMenuText}>Delete Community</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("CommunityOverviewScreen", { id: community.id });
              }}
            >
              <Ionicons name="settings-outline" size={18} color="#666" />
              <Text style={styles.menuText}>Community Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Close menu when clicking outside */}
      {showMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        />
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Groups List */}
      {displayGroups.map(group => (
        <GroupListItem 
          key={group.id}
          group={group}
          community={community}
          navigation={navigation}
          formatDate={formatDate}
          isAnnouncements={group.isAnnouncement}
          isGeneral={!group.isAnnouncement && group.name === "General"}
          isAdmin={isAdmin}
        />
      ))}

      {/* Loading and Empty States */}
      {groupsLoading && communityGroups.length === 0 && (
        <View style={styles.groupsLoadingContainer}>
          <ActivityIndicator size="small" color="#25D366" />
          <Text style={styles.groupsLoadingText}>Loading groups...</Text>
        </View>
      )}

      {!groupsLoading && communityGroups.length === 0 && (
        <View style={styles.emptyGroupsContainer}>
          <Ionicons name="chatbubble-outline" size={30} color="#ccc" />
          <Text style={styles.emptyGroupsText}>
            No groups in this community yet{"\n"}
            {isAdmin && (
              <Text style={styles.adminHintText}>
                Tap "Create Group" to add the first group
              </Text>
            )}
          </Text>
        </View>
      )}

      {/* View More/Less Button */}
      {hasMoreGroups && (
        <TouchableOpacity 
          style={styles.viewMoreButton}
          onPress={() => setShowAllGroups(!showAllGroups)}
        >
          <Text style={styles.viewMoreText}>
            {showAllGroups ? 'View less' : `View all ${communityGroups.length} groups`}
          </Text>
          <Ionicons 
            name={showAllGroups ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#25D366" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const GroupListItem = ({ group, community, navigation, formatDate, isAnnouncements, isGeneral, isAdmin }) => {
  const iconName = isAnnouncements ? "megaphone-outline" : "people-outline";
  const backgroundColor = isAnnouncements ? "#d4f8d4" : "#e6e6e6";
  const groupName = isAnnouncements ? "Announcements" : isGeneral ? "General" : group.name;
  
  const lastMessage = group.lastMessage || 
    (isAnnouncements ? "Community announcements" : 
     isGeneral ? "General discussions" : "Group chat");

  const chatId = group.groupId || group.id;

  return (
    <View style={styles.groupItemContainer}>
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() =>
          navigation.navigate("ChatDetailScreen", {
            chatId: chatId,
            name: `${community.name} - ${groupName}`,
            isGroup: true,
            isCommunity: true,
            communityId: community.id,
            isAnnouncements: isAnnouncements,
          })
        }
      >
        <View style={[styles.groupIcon, { backgroundColor }]}>
          <Ionicons name={iconName} size={18} color="#000" />
        </View>
  
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.groupMessage} numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>
  
        <View style={styles.groupDateContainer}>
          <Text style={styles.groupDate}>
            {formatDate(group.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};  

const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2"
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 10,
    color: "#666"
  },

  // Create Community Card styles
  createCommunityCard: {
    backgroundColor: "#fff",
    paddingBottom: 12,
    marginBottom: 10,
    margin: 0,
    marginTop: 0,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "400",
    marginTop: 24,
  },
  newCommunityButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    margin: 10,
    borderRadius: 10,
    borderWidth: 0
  },
  communityIconContainer: {
    marginRight: 12
  },
  communityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EDEDED",
    justifyContent: "center",
    alignItems: "center"
  },
  addIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#25D366",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  newCommunityTextContainer: {
    flex: 1
  },
  newCommunityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000"
  },

  // Communities section
  communitiesSection: {
    paddingHorizontal: 10
  },

  // Empty state styles
  emptyState: {
    backgroundColor: "#fff",
    padding: 30,
    alignItems: "center",
    margin: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  emptyStateTitle: {
    fontSize: 20,
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600"
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20
  },
  createFirstButton: {
    backgroundColor: "#25D366",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center"
  },
  buttonIcon: {
    marginRight: 8
  },
  createFirstButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  emptyStateHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 16,
    textAlign: "center"
  },

  // Community Card styles
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
    position: 'relative'
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  communityTitle: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  communityTitleContainer: {
    flex: 1,
    marginLeft: 12
  },
  communityName: {
    fontSize: 18,
    fontWeight: "600"
  },
  menuButton: {
    padding: 8
  },
  menuOptions: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
    minWidth: 180
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  },
  deleteMenuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: '500'
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16
  },

  // Group List Item styles
  groupItemContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    flex: 1
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  groupInfo: {
    flex: 1,
    marginRight: 8
  },
  groupName: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 2
  },
  groupMessage: {
    color: "#666",
    fontSize: 14
  },
  groupDateContainer: {
    minWidth: 70,
    alignItems: "flex-end"
  },
  groupDate: {
    fontSize: 12,
    color: "#666",
    textAlign: "right"
  },

  // Groups loading and empty states
  groupsLoadingContainer: {
    alignItems: "center",
    paddingVertical: 20
  },
  groupsLoadingText: {
    color: "#666",
    marginTop: 8,
    fontSize: 14
  },
  emptyGroupsContainer: {
    alignItems: "center",
    paddingVertical: 20
  },
  emptyGroupsText: {
    color: "#666",
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20
  },
  adminHintText: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '500'
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0"
  },
  viewMoreText: {
    color: "#25D366",
    fontWeight: "500",
    fontSize: 14,
    marginRight: 4
  }
});



export default Community;