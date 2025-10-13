import React, { useEffect, useState } from "react";
import { 
  View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert 
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

const GroupInfoScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth().currentUser;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("groups")
      .doc(groupId)
      .onSnapshot(async (doc) => {
        if (!doc.exists) return;
        const data = doc.data();
        setGroup(data);

        // Fetch member names
        const memberDocs = await Promise.all(
          data.members.map(async (uid: string) => {
            const userDoc = await firestore().collection("users").doc(uid).get();
            return { id: uid, name: userDoc.data()?.name || "Unknown User" };
          })
        );

        setMembers(memberDocs);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [groupId]);

  // ✅ Remove group
  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await firestore().collection("groups").doc(groupId).delete();
            navigation.goBack();
          },
        },
      ]
    );
  };
  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!group) return;
  
            // Remove member from Firestore
            const updatedMembers = group.members.filter((uid: string) => uid !== memberId);
            await firestore()
              .collection("groups")
              .doc(groupId)
              .update({ members: updatedMembers });
  
            // Update local state immediately
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
          },
        },
      ]
    );
  };
  
  // ✅ Exit group
  const handleExitGroup = () => {
    if (!currentUser) return;
    if (group.admin === currentUser.uid) {
      // Admin leaving
      if (group.members.length === 1) {
        // Only one member, delete group
        handleDeleteGroup();
        return;
      }

      // Prompt to choose new admin
      Alert.alert(
        "You are admin",
        "Select a new admin before leaving",
        members
          .filter((m) => m.id !== currentUser.uid)
          .map((m) => ({
            text: m.name,
            onPress: async () => {
              await firestore()
                .collection("groups")
                .doc(groupId)
                .update({
                  admin: m.id,
                  members: group.members.filter((uid: string) => uid !== currentUser.uid),
                });
              navigation.goBack();
            },
          }))
      );
    } else {
      // Normal member leaving
      firestore()
        .collection("groups")
        .doc(groupId)
        .update({
          members: group.members.filter((uid: string) => uid !== currentUser.uid),
        });
      navigation.goBack();
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#555" />;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        {group.name}
      </Text>

      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        Admin:{" "}
        <Text style={{ fontWeight: "bold", color: "blue" }}>
          {members.find((m) => m.id === group.admin)?.name || "Unknown"}
        </Text>
      </Text>

      <Text style={{ fontSize: 18, marginBottom: 6 }}>Members:</Text>
      <FlatList
  data={members}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const isAdmin = currentUser?.uid === group.admin;
    const isMemberAdmin = item.id === group.admin;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 6,
        }}
      >
        <Text style={{ fontSize: 16, color: isMemberAdmin ? "blue" : "black" }}>
          {item.name} {isMemberAdmin ? "(Admin)" : ""}
        </Text>

        {/* Admin can remove other members */}
        {isAdmin && !isMemberAdmin && (
          <TouchableOpacity
            onPress={() => handleRemoveMember(item.id, item.name)}
            style={{
              padding: 6,
              backgroundColor: "#f44336",
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff" }}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }}
/>


      {/* Admin Controls */}
      {currentUser?.uid === group.admin && (
        <TouchableOpacity
          onPress={handleDeleteGroup}
          style={{
            marginTop: 20,
            padding: 12,
            backgroundColor: "red",
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete Group</Text>
        </TouchableOpacity>
      )}

      {/* Exit Group */}
      <TouchableOpacity
        onPress={handleExitGroup}
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: "#f0ad4e",
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Exit Group</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GroupInfoScreen;
