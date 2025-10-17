import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Alert 
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import auth from "@react-native-firebase/auth";

type RootStackParamList = {
  GroupCreationScreen: { 
    selectedMembers: string[]; 
    selectedUsersData: any[];
    communityId?: string;
  };
};

type SelectMembersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GroupCreationScreen'
>;

export default function SelectMembersScreen() {
  const navigation = useNavigation<SelectMembersScreenNavigationProp>();
  const route = useRoute();
  
  const currentUser = auth().currentUser;
  const currentUserId = currentUser?.uid;
  const { communityId } = route.params || {};
  
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchData = async () => {
      try {
        // Check admin status for community
        if (communityId) {
          const communityDoc = await firestore()
            .collection("communities")
            .doc(communityId)
            .get();
          
          const communityData = communityDoc.data();
          if (communityData && communityData.admin === currentUserId) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            Alert.alert("Access Denied", "Only community admin can add members");
            navigation.goBack();
            return;
          }
        } else {
          // For regular groups, user is always admin (they're creating it)
          setIsAdmin(true);
        }

        // Fetch users (excluding current user)
        const unsub = firestore().collection("users").onSnapshot(snapshot => {
          const allUsers = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          // ✅ FIXED: Filter out current user properly
          const filteredUsers = allUsers.filter(user => {
            // Check both id and uid fields to exclude current user
            const userId = user.id || user.uid;
            return userId !== currentUserId;
          });
          
          setUsers(filteredUsers);
        });

        return unsub;

      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Failed to load users");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = fetchData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId, communityId, navigation]);

  const toggleSelect = (uid: string) => {
    if (!isAdmin) return;
    setSelected(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateGroup = () => {
    if (!isAdmin) {
      Alert.alert("Access Denied", "Only admin can create groups");
      return;
    }

    const selectedUsersData = users.filter(user => selected.includes(user.id));
  
    if (selected.length === 0) {
      return Alert.alert("Error", "Select at least one member");
    }
  
    navigation.navigate("GroupCreationScreen", { 
      selectedMembers: selected,
      selectedUsersData: selectedUsersData,
      communityId: communityId
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Access Denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {communityId ? "Select Community Members" : "Select Members"}
      </Text>
      
      {communityId && (
        <Text style={styles.communityNote}>
          🏢 Creating group for community (Admin Only)
        </Text>
      )}
      
      <Text style={styles.subtitle}>
        {selected.length} member{selected.length !== 1 ? 's' : ''} selected
      </Text>
      
      <FlatList
        data={users}
        keyExtractor={item => item.id || item.uid} // ✅ Handle both id and uid
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleSelect(item.id || item.uid)}
            style={[
              styles.userItem,
              selected.includes(item.id || item.uid) ? styles.selectedItem : styles.unselectedItem
            ]}
          >
            <Text style={[
              styles.userName,
              selected.includes(item.id || item.uid) && styles.selectedText
            ]}>
              {item.name || "Unknown User"}
            </Text>
            {item.email && (
              <Text style={[
                styles.userEmail,
                selected.includes(item.id || item.uid) && styles.selectedText
              ]}>
                {item.email}
              </Text>
            )}
          </TouchableOpacity>
        )}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              All available users are already in the group or you might be the only user.
            </Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={[
          styles.nextButton,
          (selected.length === 0 || !isAdmin) && styles.nextButtonDisabled
        ]} 
        onPress={handleCreateGroup}
        disabled={selected.length === 0 || !isAdmin}
      >
        <Text style={styles.nextButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: "#ECE5DD"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECE5DD"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#25D366",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#25D366",
    marginBottom: 20,
    textAlign: "center",
  },
  communityNote: {
    fontSize: 12,
    color: "#075E54",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
  },
  list: {
    flex: 1,
  },
  userItem: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
  },
  selectedItem: {
    backgroundColor: "#25D366",
  },
  unselectedItem: {
    backgroundColor: "#FFFFFF",
  },
  userName: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  userEmail: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  selectedText: {
    color: "#FFFFFF",
  },
  nextButton: {
    backgroundColor: "#25D366",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  nextButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});