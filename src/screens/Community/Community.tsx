import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Navbar from "../../components/Navbar";
import Ionicons from "react-native-vector-icons/Ionicons";
import { db } from "../../utils/firebaseConfig";

const Community = ({ navigation }: { navigation: any }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = db.collection("communities")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        const communitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCommunities(communitiesData);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString();
    } catch (error) {
      return "Recently";
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f2f2f2", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading communities...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* ✅ White card for Header + New Community */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingBottom: 8,
            marginBottom: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 40,
              paddingBottom: 12,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "600" }}>
              Communities
            </Text>
          </View>

          {/* New Community */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
            onPress={() => navigation.navigate("CreateCommunityScreen")}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#eee",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
                position: "relative",
              }}
            >
              <Icon name="people-outline" size={28} color="#000" />
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: "#25D366",
                  borderRadius: 10,
                  padding: 2,
                }}
              >
                <Icon name="add" size={14} color="#fff" />
              </View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "500" }}>
              New community
            </Text>
          </TouchableOpacity>
        </View>

        {/* Communities List */}
        {communities.map((community) => (
          <CommunityCard 
            key={community.id} 
            community={community} 
            navigation={navigation} 
            formatDate={formatDate}
          />
        ))}

        {/* Empty State */}
        {communities.length === 0 && (
          <View style={{ 
            backgroundColor: "#fff", 
            padding: 40, 
            alignItems: "center", 
            margin: 10, 
            borderRadius: 10 
          }}>
            <Ionicons name="people-outline" size={50} color="#ccc" />
            <Text style={{ 
              fontSize: 16, 
              color: "#666", 
              marginTop: 10, 
              textAlign: "center" 
            }}>
              No communities yet. Create your first community to get started!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navbar */}
      <Navbar navigation={navigation} />
    </View>
  );
};

// Community Card Component
// Community Card Component
const CommunityCard = ({ community, navigation, formatDate }) => {
  const [communityGroups, setCommunityGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);

  useEffect(() => {
    if (!community.id) return;

    // 🚨 DEBUG: Add this line
    console.log("🔍 [DEBUG] Fetching groups for community:", community.id, community.name);
    
    const unsubscribe = db.collection("communities")
      .doc(community.id)
      .collection("groups")
      .onSnapshot(snapshot => {
        const groups = snapshot.docs.map(doc => {
          const data = doc.data();
          // 🚨 DEBUG: Add this line to see each group
          console.log(`📦 [DEBUG] Group found: "${data.name}" | ID: ${doc.id} | isAnnouncement: ${data.isAnnouncement} | members: ${data.members?.length}`);
          return {
            id: doc.id,
            ...data
          };
        });
        // 🚨 DEBUG: Add this line to see all groups
        console.log("📋 [DEBUG] Total groups found:", groups.length, "in community:", community.name);
        console.log("📊 [DEBUG] All groups data:", groups);
        
        setCommunityGroups(groups);
        setGroupsLoading(false);
      }, error => {
        console.error("❌ [DEBUG] Error fetching community groups:", error);
        setGroupsLoading(false);
      });

    return () => unsubscribe();
  }, [community.id]);

  // Separate default groups from custom groups
  const announcementsGroup = communityGroups.find(g => g.isAnnouncement);
  const generalGroup = communityGroups.find(g => !g.isAnnouncement && g.name === "General");
  const customGroups = communityGroups.filter(g => !g.isAnnouncement && g.name !== "General");

  // 🚨 DEBUG: Add this line to see filtered results
  console.log("🎯 [DEBUG] Filtered groups for", community.name, ":", {
    announcements: announcementsGroup?.name || "None",
    general: generalGroup?.name || "None", 
    custom: customGroups.map(g => g.name)
  });

  return (
    <View
      style={{
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        paddingVertical: 24,
        marginBottom: 10,
      }}
    >
      {/* Community Header */}
      <TouchableOpacity 
        style={{ flexDirection: "row", alignItems: "center" }}
        onPress={() => navigation.navigate("CommunityOverviewScreen", { id: community.id })}
      >
        <Ionicons name="people-outline" size={28} color="#000" />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            marginVertical: 12,
            marginLeft: 8,
          }}
        >
          {community.name}
        </Text>
      </TouchableOpacity>

      {/* Grey divider line */}
      <View
        style={{
          height: 1,
          backgroundColor: "#ddd",
          marginVertical: 8,
        }}
      />

      {/* Announcements Group */}
      {announcementsGroup && (
        <GroupListItem 
          group={announcementsGroup}
          community={community}
          navigation={navigation}
          formatDate={formatDate}
          isAnnouncements={true}
        />
      )}

      {/* General Group */}
      {generalGroup && (
        <GroupListItem 
          group={generalGroup}
          community={community}
          navigation={navigation}
          formatDate={formatDate}
          isGeneral={true}
        />
      )}

      {/* Custom Groups */}
      {customGroups.map(group => (
        <GroupListItem 
          key={group.id}
          group={group}
          community={community}
          navigation={navigation}
          formatDate={formatDate}
        />
      ))}

      {/* Loading State for Groups */}
      {groupsLoading && communityGroups.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#25D366" />
          <Text style={{ color: "#666", marginTop: 8 }}>Loading groups...</Text>
        </View>
      )}

      {/* No groups message - ADD THIS */}
      {!groupsLoading && communityGroups.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Ionicons name="chatbubble-outline" size={30} color="#ccc" />
          <Text style={{ color: "#666", marginTop: 8, textAlign: 'center' }}>
            No groups in this community yet{"\n"}
            <Text style={{ fontSize: 12, color: '#999' }}>
              Create groups from the community overview
            </Text>
          </Text>
        </View>
      )}

      {/* View all link */}
      {communityGroups.length > 0 && (
        <TouchableOpacity 
          style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}
          onPress={() => navigation.navigate("CommunityOverviewScreen", { id: community.id })}
        >
          <Ionicons name="chevron-forward" size={16} color="#808080" style={{marginLeft: 8}}/>
          <Text style={{ 
            color: "#808080", 
            marginLeft: 4, 
            fontWeight: "500", 
            fontSize: 16, 
            marginLeft: 36 
          }}>
            View all {communityGroups.length} groups
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Group List Item Component
// In Community.tsx - Update the GroupListItem component:

const GroupListItem = ({ group, community, navigation, formatDate, isAnnouncements, isGeneral }) => {
  const iconName = isAnnouncements ? "megaphone-outline" : "people-outline";
  const backgroundColor = isAnnouncements ? "#d4f8d4" : "#e6e6e6";
  const groupName = isAnnouncements ? "Announcements" : isGeneral ? "General" : group.name;
  
  const lastMessage = group.lastMessage || 
    (isAnnouncements ? "Community announcements" : 
     isGeneral ? "General discussions" : "Group chat");

  // 🚨 FIX: Use the correct ID for navigation
  const chatId = group.groupId || group.id; // Use groupId if exists, otherwise use the document id

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
      }}
      onPress={() => navigation.navigate("ChatDetailScreen", { 
        chatId: chatId,
        name: `${community.name} - ${groupName}`,
        isGroup: true,
        isCommunity: true,
        communityId: community.id,
        isAnnouncements: isAnnouncements
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: backgroundColor,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={iconName} size={18} color="#000" />
      </View>
      <View style={{ flex: 1, padding: 4 }}>
        <Text style={{ fontWeight: "500", fontSize: 16 }}>{groupName}</Text>
        <Text style={{ color: "#555" }} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: "#555" }}>
        {formatDate(group.createdAt)}
      </Text>
    </TouchableOpacity>
  );
};

export default Community;