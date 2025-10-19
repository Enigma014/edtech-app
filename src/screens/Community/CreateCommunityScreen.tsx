import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { db, storageService } from "../../utils/firebaseConfig";
import { authService } from "../../utils/firebaseConfig";
import firestore from "@react-native-firebase/firestore";
export default function CreateCommunityScreen({ navigation }) {
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState(
    "Hi everyone! This community is for members to chat in topic-based groups and get important announcements."
  );
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentUser = authService.currentUser;

  // Select image
  const pickImage = () => {
    launchImageLibrary({ mediaType: "photo" }, (response) => {
      if (response.assets && response.assets[0]) {
        setPhoto(response.assets[0]);
      }
    });
  };

  // Create community with your existing structure
  const createCommunity = async () => {
    if (!communityName.trim()) {
      return Alert.alert("Error", "Please enter a community name");
    }

    if (!currentUser) {
      return Alert.alert("Error", "You must be logged in to create a community");
    }

    setLoading(true);

    try {
      let photoURL = "";

      // Upload image if selected
      if (photo) {
        const imageRef = storageService.ref(`communities/${Date.now()}_${photo.fileName}`);
        const img = await fetch(photo.uri);
        const bytes = await img.blob();
        await imageRef.put(bytes);
        photoURL = await imageRef.getDownloadURL();
      }

      // Create community document (your existing structure)
      const communityRef = await db.collection("communities").add({
        name: communityName,
        description,
        photoURL,
        createdBy: currentUser.uid,
        admin: currentUser.uid,
        members: [currentUser.uid],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        lastAnnouncement: "Community created - welcome everyone!",
        lastGeneralMessage: "Let's start the conversation!",
      });

      const communityId = communityRef.id;

      // Create default groups using your subcollection structure
      const defaultGroups = [
        {
          name: "Announcements",
          description: "Official announcements from community admins",
          isAnnouncement: true,
          lastMessage: "Community announcements will appear here",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: firestore.FieldValue.serverTimestamp(),
        },
        {
          name: "General",
          description: "General discussions for all community members",
          isAnnouncement: false,
          lastMessage: "Welcome to the general chat!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: firestore.FieldValue.serverTimestamp(),
        }
      ];

      // Add groups to the community's groups subcollection
      for (const group of defaultGroups) {
        await db.collection("communities").doc(communityId).collection("groups").add(group);
      }

      setLoading(false);
      Alert.alert("Success", "Community created successfully!");
      navigation.navigate("CommunityOverviewScreen", { id: communityId });
      
    } catch (error) {
      console.error("Error creating community:", error);
      Alert.alert("Error", "Failed to create community");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>New community</Text>
        {/* <Text style={styles.subtitle}>Create a new community with announcement and general groups</Text> */}

        {/* Community Photo */}
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Text style={styles.placeholderIconText}>👥</Text>
              </View>
              <Text style={styles.changePhotoText}>Add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Community Name */}
        <Text style={styles.label}>Community Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter community name"
          placeholderTextColor="#999"
          maxLength={100}
          value={communityName}
          onChangeText={setCommunityName}
        />
        <Text style={styles.counter}>{communityName.length}/100</Text>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Describe your community"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          maxLength={2048}
        />
        <Text style={styles.counter}>{description.length}/2048</Text>

        {/* Info Section */}
        {/* <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Default Groups</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Announcements:</Text> Only admins can post
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>General:</Text> All members can chat
          </Text>
        </View> */}
      </ScrollView>

      {/* Create Button */}
      <TouchableOpacity
        style={[
          styles.createButton,
          (!communityName.trim() || loading) && styles.createButtonDisabled
        ]}
        onPress={createCommunity}
        disabled={!communityName.trim() || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Community</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#fff" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "400", 
    marginTop: 24,
    marginBottom: 12,
    color: "#000"
  },
  subtitle: { 
    color: "#666", 
    marginBottom: 30,
    fontSize: 14
  },
  imageContainer: { 
    alignItems: "center", 
    marginBottom: 30 
  },
  placeholder: { 
    alignItems: "center" 
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
  },
  placeholderIconText: {
    fontSize: 40
  },
  changePhotoText: { 
    color: "#25D366", 
    fontSize: 16,
    fontWeight: "500"
  },
  image: { 
    width: 100, 
    height: 100, 
    borderRadius: 50 
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
    backgroundColor: "#f8f8f8",
  },
  counter: { 
    alignSelf: "flex-end", 
    color: "#999", 
    marginTop: 4, 
    fontSize: 12 
  },
  infoBox: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginTop: 20
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000"
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  bold: {
    fontWeight: "bold"
  },
  createButton: {
    backgroundColor: "#25D366",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10
  },
  createButtonDisabled: {
    backgroundColor: "#ccc"
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});