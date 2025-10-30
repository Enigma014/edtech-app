// App.tsx
import React, { useEffect, useState } from "react";
import { StatusBar, useColorScheme, ActivityIndicator, View, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NativeBaseProvider } from "native-base";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import auth from "@react-native-firebase/auth";
import { isAuthOperationInProgress } from '@utils/authGate';

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


const Stack = createNativeStackNavigator();

const App = () => {
  const isDarkMode = useColorScheme() === "dark";
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  let deferTimer: ReturnType<typeof setTimeout> | null = null;

  const handleAuthUser = async (firebaseUser: any) => {
    try {
      // Make sure we have the latest emailVerified flag
      await firebaseUser.reload();

      if (!firebaseUser.emailVerified) {
        await auth().signOut();
        setUser(null);
        if (initializing) setInitializing(false);
        return;
      }

      // Optional small delay to allow Firestore write (e.g. immediately after registration)
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));

      // Check Firestore user doc
      const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
      if (userDoc.exists()) {
        setUser(firebaseUser);
      } else {
        await auth().signOut();
        Alert.alert('Account not registered', 'Please register your account before logging in.');
        setUser(null);
      }
    } catch (err) {
      try {
        await auth().signOut();
      } catch (_) {}
      setUser(null);
    } finally {
      if (initializing) setInitializing(false);
    }
  };

  const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
    // If there is no user, ensure null and stop initializing if needed.
    if (!firebaseUser) {
      setUser(null);
      if (initializing) setInitializing(false);
      return;
    }

    // If an auth operation (login/register) is in progress, defer handling a bit
    if (isAuthOperationInProgress()) {
      // clear any existing timer then set a new deferred check
      if (deferTimer) clearTimeout(deferTimer);
      deferTimer = setTimeout(async () => {
        try {
          const current = auth().currentUser;
          if (!current) {
            setUser(null);
            if (initializing) setInitializing(false);
            return;
          }
          await handleAuthUser(current);
        } catch (err) {
          try { 
            await auth().signOut(); 
          } catch (_) {}
          setUser(null);
          if (initializing) setInitializing(false);
        }
      }, 500); // 500ms gives the auth flow time to finish; tweak if necessary
      return;
    }

    // No auth operation in progress — handle immediately
    await handleAuthUser(firebaseUser);
  });

  return () => {
    unsubscribe();
    if (deferTimer) clearTimeout(deferTimer);
  };
}, [initializing]);


  // Show loader until auth initialization completes to avoid flicker
  if (initializing) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NativeBaseProvider>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" />
            </View>
          </NativeBaseProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  

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

