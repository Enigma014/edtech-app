/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { Text } from 'react-native';
import LoginScreen from './src/auth/Login';
//import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  //useSafeAreaInsets,
} from 'react-native-safe-area-context';


function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
      <LoginScreen/>
    </SafeAreaProvider>
  );
}

function AppContent() {
  //const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Text> HelloWorld! </Text>
      <Text> HelloWorld! </Text>
      <Text> HelloWorld! </Text>
      <Text> HelloWorld! </Text>
      <Text> HelloWorld! </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
