// src/screens/CreateCommunityScreen.js
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
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { db, storage } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreateCommunityScreen({ navigation }) {
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState(
    "Hi everyone! This community is for members to chat in topic-based groups and get important announcements."
  );
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Select image
  const pickImage = () => {
    launchImageLibrary({ mediaType: "photo" }, (response) => {
      if (response.assets && response.assets[0]) {
        setPhoto(response.assets[0]);
      }
    });
  };

  // Upload to Firebase
  const createCommunity = async () => {
    if (!communityName.trim()) {
      return Alert.alert("Please enter a community name");
    }

    setLoading(true);
    let photoURL = "";

    try {
      if (photo) {
        const imageRef = ref(storage, `communities/${Date.now()}_${photo.fileName}`);
        const img = await fetch(photo.uri);
        const bytes = await img.blob();
        await uploadBytes(imageRef, bytes);
        photoURL = await getDownloadURL(imageRef);
      }

      // Create Firestore entry
      const docRef = await addDoc(collection(db, "communities"), {
        name: communityName,
        description,
        photoURL,
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      Alert.alert("Success", "Community created successfully!");
      navigation.navigate("CommunityHome", { id: docRef.id }); // optional
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to create community");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New community</Text>
      <Text style={styles.subtitle}>See examples of different communities</Text>

      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Image
              source={require("../../assets/group-placeholder.png")}
              style={{ width: 50, height: 50, tintColor: "#999" }}
            />
            <Text style={styles.changePhotoText}>Change photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Community name"
        maxLength={100}
        value={communityName}
        onChangeText={setCommunityName}
      />
      <Text style={styles.counter}>{communityName.length}/100</Text>

      <TextInput
        style={styles.textArea}
        multiline
        value={description}
        onChangeText={setDescription}
        maxLength={2048}
      />
      <Text style={styles.counter}>{description.length}/2048</Text>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={createCommunity}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextText}>→</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 5 },
  subtitle: { color: "#1a73e8", marginBottom: 20 },
  imageContainer: { alignItems: "center", marginVertical: 20 },
  placeholder: { alignItems: "center" },
  changePhotoText: { color: "#4CAF50", marginTop: 5 },
  image: { width: 120, height: 120, borderRadius: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 15,
    height: 120,
    padding: 10,
    fontSize: 15,
    textAlignVertical: "top",
  },
  counter: { alignSelf: "flex-end", color: "#999", marginTop: 4, fontSize: 12 },
  nextButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#00a884",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: { fontSize: 28, color: "#fff", fontWeight: "bold" },
});
