import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Navbar from "../components/Navbar";
import Ionicons from "react-native-vector-icons/Ionicons";
const Community = ({ navigation }: { navigation: any }) => {
  return (
    // ✅ Grey background for the whole screen
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* ✅ White card for Header + New Community */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingBottom: 8,
            marginBottom: 10, // ✅ Creates gap before next community
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 40,
              paddingBottom: 12,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "600" }}>
              Communities
            </Text>
            {/* <View style={{ flexDirection: "row" }}>
              <Icon
                name="qr-code-outline"
                size={24}
                color="#000"
                style={{ marginRight: 20 }}
              />
              <Icon name="ellipsis-vertical" size={22} color="#000" />
            </View> */}
          </View>

          {/* New Community */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#eee",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Icon name="people-outline" size={28} color="#000" />
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: "#25D366",
                  borderRadius: 10,
                  padding: 2,
                }}
              >
                <Icon name="add" size={14} color="#fff" />
              </View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "500" }}>
              New community
            </Text>
          </TouchableOpacity>
        </View>

        {/* ✅ White card for each community */}
        <View
  style={{
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginBottom: 10,
  }}
>
  {/* Group title */}
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Ionicons name="people-outline" size={28} color="#000" />
    <Text
      style={{
        fontSize: 16,
        fontWeight: "500",
        marginVertical: 12,
        marginLeft: 8,
      }}
    >
      Techfest 2025
    </Text>
  </View>

  {/* Grey divider line */}
  <View
    style={{
      height: 1,
      backgroundColor: "#ddd",
      marginVertical: 8,
    }}
  />

  {/* Announcements sub-chat */}
  <TouchableOpacity
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    }}
  >
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "#d4f8d4",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      }}
    >
      <Ionicons name="megaphone-outline" size={18} color="#000" />
    </View>
    <View style={{ flex: 1 ,padding:4}}>
      <Text style={{ fontWeight: "500",fontSize: 16 }}>Announcements</Text>
      <Text style={{ color: "#555" }} numberOfLines={1}>
        +91 9898989898: Does anyone ...
      </Text>
    </View>
    <Text style={{ fontSize: 12, color: "#555" }}>11/07/2025</Text>
  </TouchableOpacity>

  {/* General sub-chat */}
  <TouchableOpacity
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    }}
  >
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: "#e6e6e6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      }}
    >
      <Ionicons name="people-outline" size={18} color="#000" />
    </View>
    <View style={{ flex: 1 ,padding:4}}>
      <Text style={{ fontWeight: "500",fontSize: 16 }}>General</Text>
      <Text style={{ color: "#555" }} numberOfLines={1}>
        You: Let’s meet at 5pm
      </Text>
    </View>
    <Text style={{ fontSize: 12, color: "#555" }}>11/07/2025</Text>
  </TouchableOpacity>

  {/* View all link */}
  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
  <Ionicons name="chevron-forward" size={16} color="#808080" style={{marginLeft:8}}/>
  <Text style={{ color: "#808080", marginLeft: 4, fontWeight: "500", fontSize: 16 , marginLeft: 36}}>
    View all
  </Text>
</TouchableOpacity>

</View>

      </ScrollView>

      {/* Bottom Navbar */}
      <Navbar navigation={navigation} />
    </View>
  );
};

export default Community;
