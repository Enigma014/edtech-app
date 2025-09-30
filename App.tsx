import React from 'react';
import { StatusBar, useColorScheme} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeBaseProvider } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/auth/Login';
import RegisterScreen from './src/auth/Register';
import SettingsScreen from './src/screens/Settings';
import CommunityScreen from './src/screens/Community';
import ChatScreen from './src/screens/Chat';
import ProductScreen from './src/screens/Product';
import SplashScreen from './src/screens/Splash';
import SubscriptionScreen from './src/screens/Subscription';
import ChatDetail from './src/screens/ChatDetail';
import ProfileScreen from './src/screens/Profile';
import '@utils/firebaseConfig';
const Stack = createNativeStackNavigator();

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Stack.Navigator initialRouteName="SplashScreen">
          <Stack.Screen
              name="SplashScreen"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterScreen"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SubscriptionScreen"
              component={SubscriptionScreen}
              options={{ headerShown: false }}
            />
            
            <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
      <Stack.Screen
              name="SettingsScreen"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CommunityScreen"
              component={CommunityScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatScreen"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatDetailScreen"
              component={ChatDetail}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProductScreen"
              component={ProductScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfileScreen"
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
          

        </NavigationContainer>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
};

export default App;
