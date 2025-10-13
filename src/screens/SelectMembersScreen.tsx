import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Define the navigation param list type
type RootStackParamList = {
  GroupCreationScreen: { selectedMembers: string[]; selectedUsersData: any[] };
};

// Define the navigation prop type
type SelectMembersScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GroupCreationScreen'
>;

export default function SelectMembersScreen() {
  const navigation = useNavigation<SelectMembersScreenNavigationProp>();
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const unsub = firestore().collection("users").onSnapshot(snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const toggleSelect = (uid: string) => {
    setSelected(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateGroup = () => {
    const selectedUsersData = users.filter(user => selected.includes(user.id));
  
    if (selected.length === 0) {
      return alert("Select at least one member");
    }
  
    navigation.navigate("GroupCreationScreen", { 
      selectedMembers: selected,
      selectedUsersData: selectedUsersData
    });
  };
  

  // ... rest of your component remains the same
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Members</Text>
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
            {item.email && (
              <Text style={[
                styles.userEmail,
                selected.includes(item.id) && styles.selectedText
              ]}>
                {item.email}
              </Text>
            )}
          </TouchableOpacity>
        )}
        style={styles.list}
      />
      
      <TouchableOpacity 
        style={[
          styles.nextButton,
          selected.length === 0 && styles.nextButtonDisabled
        ]} 
        onPress={handleCreateGroup}
        disabled={selected.length === 0}
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#25D366",
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#25D366",
    marginBottom: 20,
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