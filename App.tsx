// App.tsx
import React, { useEffect, useState } from "react";
import { StatusBar, useColorScheme, ActivityIndicator, View, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NativeBaseProvider } from "native-base";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import auth from "@react-native-firebase/auth";

import LoginScreen from "./src/auth/Login";
import RegisterScreen from "./src/auth/Register";
import ForgotPasswordScreen from "./src/auth/models/ForgotPasswordScreen";
import SettingsScreen from "./src/screens/Settings/Settings";
import CommunityScreen from "./src/screens/Community/Community";
import CreateCommunityScreen from "./src/screens/Community/CreateCommunityScreen";
import CommunityOverviewScreen from "./src/screens/Community/CommunityOverviewScreen";
import ManageGroupsScreen from "./src/screens/Community/ManageGroupScreen";
import ChatScreen from "./src/screens/Chats/Chat";
import ProductScreen from "./src/screens/Product";
import SplashScreen from "./src/screens/SplashScreen";
import SubscriptionScreen from "./src/screens/Subscription";
import ChatDetail from "./src/screens/Chats/ChatDetail";
import ProfileScreen from "./src/screens/Settings/Profile";
import SelectMembersScreen from "./src/screens/Groups/SelectMembersScreen";
import GroupCreationScreen from "./src/screens/Groups/GroupCreationScreen";
import GroupInfoScreen from "./src/screens/Groups/GroupInfoScreen";
import ContactProfileScreen from "./src/screens/Chats/ContactProfileScreen";
import SelectGroupsScreen from "./src/screens/Community/SelectGroupsScreen";
import ListUsers from "./src/screens/Chats/ListUsers";
import firestore from "@react-native-firebase/firestore";

import "@utils/firebaseConfig";

const Stack = createNativeStackNavigator();

const App = () => {
  const isDarkMode = useColorScheme() === "dark";
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("🚪 No user — logged out");
        setUser(null);
        if (initializing) setInitializing(false);
        return;
      }
  
      console.log("🔐 Auth state: Logged in as", user.email);
  
      // Wait 1 second to let Firestore registration complete (important!)
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
  
      try {
        const userDoc = await firestore().collection("users").doc(user.uid).get();
  
        if (userDoc.exists) {
          console.log("✅ Firestore user found, fully registered");
          setUser(user);
        } else {
          console.log("⚠️ Auth user exists but not registered — logging out");
          await auth().signOut();
          Alert.alert(
            "Account not registered",
            "Please register your account before logging in."
          );
          setUser(null);
        }
      } catch (err) {
        console.error("Firestore check failed:", err);
        Alert.alert("Error", "Could not verify user data.");
        setUser(null);
      }
  
      if (initializing) setInitializing(false);
    });
  
    return unsubscribe;
  }, [initializing]);
  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NativeBaseProvider>
          <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <Stack.Navigator 
  screenOptions={{ headerShown: false }}
  initialRouteName= {user? "ChatScreen" : "SplashScreen"} // Add this line
>
  {user ? (
    // ✅ Logged-in routes
    <>
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="ChatDetailScreen" component={ChatDetail} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
      <Stack.Screen name="ProductScreen" component={ProductScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SelectMembersScreen" component={SelectMembersScreen} />
      <Stack.Screen name="GroupCreationScreen" component={GroupCreationScreen} />
      <Stack.Screen name="GroupInfoScreen" component={GroupInfoScreen} />
      <Stack.Screen name="ContactProfileScreen" component={ContactProfileScreen} />
      <Stack.Screen name="CreateCommunityScreen" component={CreateCommunityScreen} />
      <Stack.Screen name="CommunityOverviewScreen" component={CommunityOverviewScreen} />
      <Stack.Screen name="ManageGroupsScreen" component={ManageGroupsScreen} />
      <Stack.Screen name="SelectGroupsScreen" component={SelectGroupsScreen} />
      <Stack.Screen name="ListUsers" component={ListUsers} />
      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
    </>
  ) : (
    // ✅ Logged-out routes
    <>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
    </>
  )}
</Stack.Navigator>
          </NavigationContainer>
        </NativeBaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

