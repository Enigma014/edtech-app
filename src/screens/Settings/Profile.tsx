// src/screens/Settings/ProfileScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import ActionSheet from "react-native-actionsheet";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import auth from "@react-native-firebase/auth";

const defaultPic = Image.resolveAssetSource(require("../../assets/Profile.jpeg")).uri;

const ProfileScreen = ({ route, navigation }) => {
  const { name: initialName, bio: initialBio, profilePic: initialProfilePic } =
    route.params;

  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [profilePic, setProfilePic] = useState(initialProfilePic || defaultPic);
  const [uploading, setUploading] = useState(false);

  const actionSheetRef = useRef<ActionSheet>(null);

  const userId = auth().currentUser?.uid;

  // ---------------- SAVE TO FIREBASE ----------------
  const handleSave = async () => {
    try {
      await firestore().collection("users").doc(userId).set(
        {
          name,
          bio,
          profilePic,
        },
        { merge: true }
      );
      Alert.alert("✅ Profile Updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("❌ Error saving profile");
    }
  };

  // ---------------- EDIT PROFILE PIC ----------------
  const handleEditPic = () => {
    actionSheetRef.current?.show();
  };

  const handleOptionSelect = async (index: number) => {
    switch (index) {
      case 0:
        pickImage("camera");
        break;
      case 1:
        pickImage("gallery");
        break;
      case 2:
        handleRemovePic();
        break;
      

      default:
        break;
    }
  };

  // ---------------- IMAGE PICKER ----------------
  const pickImage = async (source: "camera" | "gallery") => {
    const options: any = { mediaType: "photo", quality: 0.8 };

    const result =
      source === "camera"
        ? await launchCamera(options)
        : await launchImageLibrary(options);

    if (result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      if (imageUri) {
        uploadImage(imageUri);
      }
    }
  };

  // ---------------- UPLOAD TO FIREBASE STORAGE ----------------
  const uploadImage = async (uri: string) => {
    if (!userId) return;

    setUploading(true);
    try {
      const fileName = `profile_${userId}.jpg`;
      const reference = storage().ref(`profilePics/${fileName}`);

      await reference.putFile(uri);
      const downloadURL = await reference.getDownloadURL();

      setProfilePic(downloadURL);

      await firestore().collection("users").doc(userId).set(
        {
          profilePic: downloadURL,
        },
        { merge: true }
      );

      Alert.alert("✅ Profile picture updated!");

    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("❌ Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- REMOVE PROFILE PIC ----------------
  const handleRemovePic = async () => {
    try {
      // Delete from storage if not default
      if (profilePic && profilePic !== defaultPic) {
        const fileName = `profile_${userId}.jpg`;
        const reference = storage().ref(`profilePics/${fileName}`);
        await reference.delete().catch(() => {}); // ignore if not found
      }

      // Reset to default
      setProfilePic(defaultPic);

      await firestore().collection("users").doc(userId).set(
        {
          profilePic: defaultPic,
        },
        { merge: true }
      );

      Alert.alert("✅ Profile picture removed!");
    } catch (error) {
      console.error("Remove error:", error);
      Alert.alert("❌ Error removing image");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("SettingsScreen")}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Profile Picture */}
      <View style={styles.profilePicContainer}>
        <Image source={{ uri: profilePic }} style={styles.profilePic} />
      </View>
      <TouchableOpacity onPress={handleEditPic}>
        <Text style={styles.editText}>
          {uploading ? "Uploading..." : "Edit"}
        </Text>
      </TouchableOpacity>

      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#999"
        />
      </View>

      {/* Bio Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>About</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Enter your bio"
          placeholderTextColor="#999"
          multiline
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={()=>{handleSave();navigation.navigate('SettingsScreen')}}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Action Sheet */}
      <ActionSheet
        ref={actionSheetRef}
        title={"Profile photo"}
        options={[
          "Camera",
          "Gallery",
          "Remove photo",
          "Cancel",
        ]}
        cancelButtonIndex={5}
        destructiveButtonIndex={2} // makes "Remove" red
        onPress={handleOptionSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "400",
    marginLeft: 8,
    marginTop: 28,
    marginBottom: 15,
    color: "#000",
  },
  profilePicContainer: {
    width: 120,
    height: 120,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ddd", // in case no image
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  editText: {
    color: "#25D366",
    fontSize: 16,
    textAlign: "center",
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#25D366",
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    fontSize: 16,
    paddingVertical: 8,
    color: "#000",
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#25D366",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 76,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: { padding: 10 },
  backArrow: { fontSize: 22, color: "#000", marginBottom: -12 },
});

export default ProfileScreen;
