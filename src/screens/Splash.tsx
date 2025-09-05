import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Logo from "../components/Logo";

const Splash = ({ navigation }: { navigation: any }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("RegisterScreen"); // replace so user can't go back to splash
    }, 2000); // 2000ms = 2 sec (you can change to 3000 for 3 sec)

    return () => clearTimeout(timer); // cleanup
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Logo />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#1d2732"
  },
});

export default Splash;
