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
  const [isAdmin, setIsAdmin] = useState(false); // 🆕 ADMIN CHECK
  const [loading, setLoading] = useState(true); // 🆕 LOADING STATE

  useEffect(() => {
    if (!currentUserId) return;

    // 🆕 CHECK IF USER IS ADMIN OF THE COMMUNITY
    const checkAdminStatus = async () => {
      try {
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
      } catch (error) {
        console.error("Error checking admin status:", error);
        Alert.alert("Error", "Failed to verify permissions");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Only fetch users if user is admin
    if (isAdmin) {
      const unsub = firestore().collection("users").onSnapshot(snapshot => {
        const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredUsers = allUsers.filter(user => 
          user.id !== currentUserId && user.uid !== currentUserId
        );
        setUsers(filteredUsers);
      });
      return unsub;
    }
  }, [currentUserId, communityId, isAdmin]);

  const toggleSelect = (uid: string) => {
    if (!isAdmin) return; // 🆕 PREVENT SELECTION IF NOT ADMIN
    setSelected(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateGroup = () => {
    if (!isAdmin) { // 🆕 ADMIN CHECK
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
        <Text>Checking permissions...</Text>
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
      
      {/* 🆕 SHOW ADMIN BADGE */}
      
      
      <Text style={styles.subtitle}>
        {selected.length} member{selected.length !== 1 ? 's' : ''} selected
      </Text>
      
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => toggleSelect(item.id)}
            style={[
              styles.userItem,
              selected.includes(item.id) ? styles.selectedItem : styles.unselectedItem
            ]}
          >
            <Text style={[
              styles.userName,
              selected.includes(item.id) && styles.selectedText
            ]}>
              {item.name}
            </Text>
            {/* {item.email && (
              <Text style={[
                styles.userEmail,
                selected.includes(item.id) && styles.selectedText
              ]}>
                {item.email}
              </Text>
            )} */}
          </TouchableOpacity>
        )}
        style={styles.list}
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
  // 🆕 ADMIN BADGE STYLE
  adminBadge: {
    fontSize: 12,
    color: "#FFD700",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#2C2C2C",
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
});