// // AddCommunityMembers.tsx - Simplified and fixed version
// import React, { useState, useEffect } from "react";
// import { 
//   View, 
//   Text, 
//   FlatList, 
//   TouchableOpacity, 
//   StyleSheet,
//   Alert,
//   ActivityIndicator
// } from "react-native";
// import firestore from "@react-native-firebase/firestore";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import auth from "@react-native-firebase/auth";
// import Ionicons from "react-native-vector-icons/Ionicons";

// export default function AddCommunityMembers() {
//   const navigation = useNavigation();
//   const route = useRoute();
  
//   const currentUser = auth().currentUser;
//   const currentUserId = currentUser?.uid;
  
//   // Debug the route params
//   console.log("AddCommunityMembers route params:", route.params);
  
//   const { 
//     communityId, 
//     communityName, 
//     groupIds = [],
//     announcementsGroupId, 
//     generalGroupId 
//   } = route.params as any;
  
//   const [users, setUsers] = useState<any[]>([]);
//   const [selected, setSelected] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [addingMembers, setAddingMembers] = useState(false);

//   useEffect(() => {
//     console.log("AddCommunityMembers mounted with:", {
//       communityId,
//       communityName,
//       groupIds,
//       announcementsGroupId,
//       generalGroupId
//     });

//     if (!currentUserId || !communityId) {
//       console.error("Missing currentUserId or communityId");
//       Alert.alert("Error", "Missing required information");
//       setLoading(false);
//       return;
//     }

//     const fetchUsers = async () => {
//       try {
//         console.log("Fetching users...");
        
//         // Get all users first
//         const usersSnapshot = await firestore().collection("users").get();
//         const allUsers = usersSnapshot.docs.map(doc => ({ 
//           id: doc.id, 
//           ...doc.data() 
//         }));
        
//         console.log("Total users found:", allUsers.length);

//         // Filter out current user
//         const filteredUsers = allUsers.filter(user => {
//           const userId = user.id || user.uid;
//           return userId !== currentUserId;
//         });
        
//         console.log("Filtered users (excluding current user):", filteredUsers.length);
//         setUsers(filteredUsers);
//         setLoading(false);
        
//       } catch (error) {
//         console.error("Error loading users:", error);
//         Alert.alert("Error", "Failed to load users");
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [currentUserId, communityId]);

//   const toggleSelect = (userId: string) => {
//     setSelected(prev =>
//       prev.includes(userId) 
//         ? prev.filter(id => id !== userId) 
//         : [...prev, userId]
//     );
//   };

//   const handleAddMembers = async () => {
//     if (selected.length === 0) {
//       Alert.alert("Error", "Please select at least one member");
//       return;
//     }

//     if (!communityId) {
//       Alert.alert("Error", "Community information missing");
//       return;
//     }

//     setAddingMembers(true);

//     try {
//       console.log("Adding members:", selected);

//       // 1. Add to community members
//       const communityDoc = await firestore()
//         .collection("communities")
//         .doc(communityId)
//         .get();
      
//       if (!communityDoc.exists) {
//         throw new Error("Community not found");
//       }

//       const communityData = communityDoc.data();
//       const currentMembers = communityData?.members || [];
      
//       const updatedCommunityMembers = [...currentMembers];
//       selected.forEach(memberId => {
//         if (!updatedCommunityMembers.includes(memberId)) {
//           updatedCommunityMembers.push(memberId);
//         }
//       });

//       await firestore()
//         .collection("communities")
//         .doc(communityId)
//         .update({
//           members: updatedCommunityMembers
//         });

//       console.log("Updated community members");

//       // 2. Add to all community groups
//       const groupsToUpdate = groupIds.length > 0 ? groupIds : [announcementsGroupId, generalGroupId].filter(Boolean);
      
//       console.log("Groups to update:", groupsToUpdate);

//       for (const groupId of groupsToUpdate) {
//         if (!groupId) continue;
        
//         try {
//           const groupDoc = await firestore()
//             .collection("groups")
//             .doc(groupId)
//             .get();
          
//           if (groupDoc.exists) {
//             const groupData = groupDoc.data();
//             const groupMembers = groupData?.members || [];
            
//             const updatedGroupMembers = [...groupMembers];
//             selected.forEach(memberId => {
//               if (!updatedGroupMembers.includes(memberId)) {
//                 updatedGroupMembers.push(memberId);
//               }
//             });

//             await firestore()
//               .collection("groups")
//               .doc(groupId)
//               .update({
//                 members: updatedGroupMembers
//               });
            
//             console.log(`Added to group: ${groupId}`);
//           }
//         } catch (groupError) {
//           console.error(`Error adding to group ${groupId}:`, groupError);
//         }
//       }

//       Alert.alert(
//         "Success", 
//         `Added ${selected.length} member(s) to ${communityName}`,
//         [{ text: "OK", onPress: () => navigation.goBack() }]
//       );

//     } catch (error: any) {
//       console.error("Error adding members:", error);
//       Alert.alert("Error", "Failed to add members to community");
//     } finally {
//       setAddingMembers(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()}>
//             <Ionicons name="arrow-back" size={24} color="#000" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Add Members</Text>
//           <View style={{ width: 24 }} />
//         </View>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#25D366" />
//           <Text>Loading available users...</Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Add Members to {communityName}</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       <Text style={styles.subtitle}>
//         Selected members will be added to all community groups
//       </Text>

//       <Text style={styles.selectedCount}>
//         {selected.length} member{selected.length !== 1 ? 's' : ''} selected
//       </Text>
      
//       {/* Users List */}
//       <FlatList
//         data={users}
//         keyExtractor={item => item.id || item.uid}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             onPress={() => toggleSelect(item.id || item.uid)}
//             style={[
//               styles.userItem,
//               selected.includes(item.id || item.uid) && styles.selectedItem
//             ]}
//           >
//             <View style={styles.userAvatar}>
//               <Text style={styles.userAvatarText}>
//                 {item.name?.[0]?.toUpperCase() || "U"}
//               </Text>
//             </View>
//             <View style={styles.userInfo}>
//               <Text style={styles.userName}>{item.name || "Unknown User"}</Text>
//               <Text style={styles.userEmail}>{item.email || ""}</Text>
//             </View>
//             {selected.includes(item.id || item.uid) ? (
//               <Ionicons name="checkmark-circle" size={24} color="#25D366" />
//             ) : (
//               <Ionicons name="ellipse-outline" size={24} color="#ccc" />
//             )}
//           </TouchableOpacity>
//         )}
//         style={styles.list}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="people-outline" size={50} color="#ccc" />
//             <Text style={styles.emptyText}>No users found</Text>
//             <Text style={styles.emptySubtext}>
//               All users might already be in this community.
//             </Text>
//           </View>
//         }
//       />
      
//       {/* Add Button */}
//       <TouchableOpacity 
//         style={[
//           styles.addButton,
//           (selected.length === 0 || addingMembers) && styles.addButtonDisabled
//         ]} 
//         onPress={handleAddMembers}
//         disabled={selected.length === 0 || addingMembers}
//       >
//         {addingMembers ? (
//           <ActivityIndicator color="#FFFFFF" />
//         ) : (
//           <Text style={styles.addButtonText}>
//             Add {selected.length} Member{selected.length !== 1 ? 's' : ''}
//           </Text>
//         )}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     textAlign: "center",
//     flex: 1,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "#666",
//     textAlign: "center",
//     marginTop: 10,
//     marginHorizontal: 20,
//     fontStyle: "italic",
//   },
//   selectedCount: {
//     fontSize: 16,
//     color: "#25D366",
//     fontWeight: "600",
//     textAlign: "center",
//     marginVertical: 15,
//   },
//   list: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   userItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   userAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#25D366",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   userAvatarText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   userInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#000",
//   },
//   userEmail: {
//     fontSize: 12,
//     color: "#666",
//     marginTop: 2,
//   },
//   selectedItem: {
//     backgroundColor: "#f0f8f0",
//     borderRadius: 8,
//   },
//   emptyContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: "#666",
//     textAlign: "center",
//     marginTop: 10,
//     marginBottom: 8,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: "#999",
//     textAlign: "center",
//     lineHeight: 20,
//   },
//   addButton: {
//     backgroundColor: "#25D366",
//     padding: 16,
//     margin: 20,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   addButtonDisabled: {
//     backgroundColor: "#CCCCCC",
//   },
//   addButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });