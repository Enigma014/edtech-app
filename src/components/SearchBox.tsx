// src/components/SearchBox.tsx
import React from "react";
import { TextInput, View, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

type Props = {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
};

const SearchBox = ({ placeholder, value, onChangeText }: Props) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color="#666" style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
  },
});

export default SearchBox;
