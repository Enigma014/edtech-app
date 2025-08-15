import React from 'react';
import { StatusBar, useColorScheme, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeBaseProvider, extendTheme } from 'native-base';
import LoginScreen from './src/auth/Login';

// Optional: extend theme if needed
const theme = extendTheme({
  colors: {
    primary: '#6200ee',
    secondary: '#03dac6',
    surface: '#ffffff',
    error: '#B00020',
  },
});

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.container}>
          <LoginScreen navigation={{ navigate: () => {} } as any} />
        </View>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
