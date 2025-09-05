import React from "react";
import { View, TextInput } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const SearchBox = () => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f1f1",
        borderRadius: 25,
        marginHorizontal: 15,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 2,

      }}
    >
      <Icon name="search-outline" size={20} color="#777" />
      <TextInput
        placeholder="Search"
        placeholderTextColor="#777"
        style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
      />
    </View>
  );
};

export default SearchBox;
