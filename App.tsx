import React from 'react';
import { StatusBar, useColorScheme} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeBaseProvider } from 'native-base';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/auth/Login';
import RegisterScreen from './src/auth/Register';
import HomeScreen from './src/screens/Home';
import CommunityScreen from './src/screens/Community';
import UpdatesScreen from './src/screens/Updates';
import ProductScreen from './src/screens/Product';
const Stack = createNativeStackNavigator();

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <NavigationContainer>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <Stack.Navigator initialRouteName="LoginScreen">
            <Stack.Screen
              name="LoginScreen"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterScreen"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
      <Stack.Screen
              name="HomeScreen"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CommunityScreen"
              component={CommunityScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="UpdatesScreen"
              component={UpdatesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProductScreen"
              component={ProductScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
};

export default App;
