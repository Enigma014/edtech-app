// src/screens/Home.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { theme } from "../core/theme";
import Navbar from "../components/Navbar";

const courses = [
  { id: "1", title: "Physics", topics: "29 topics" },
  { id: "2", title: "Chemistry", topics: "5 topics" },
  { id: "3", title: "Mathematics", topics: "12 topics" },
  { id: "4", title: "Biology", topics: "61 topics" },
  
];

const myCourses = [{ id: "1", title: "Motion in a straight line" }];

const Home = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        numColumns={1}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.courseRow}>
            {/* Circle Icon */}

{/* <View style={styles.courseCircleOuter}> */}
  <View style={styles.courseCircleInner}>
    <Text style={styles.courseCircleText}>
      {item.title.charAt(0)}
    </Text>
  </View>
{/* </View> */}


            {/* Texts */}
            <View style={{ flex: 1 }}>
              <Text style={styles.courseTitle}>{item.title}</Text>
              <Text style={styles.courseSubtitle}>{item.topics}</Text>
            </View>

            {/* Arrow */}
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        // 👇 HEADER: search + title
        ListHeaderComponent={
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" />
              <TextInput
                placeholder="Search courses..."
                placeholderTextColor="#888"
                style={styles.searchInput}
              />
            </View>

            {/* Section Title */}
            <Text style={styles.sectionTitle}>Courses</Text>
          </>
        }
        // 👇 FOOTER: My courses + Stats
        ListFooterComponent={
          <>
            {/* My Courses */}
            <Text style={styles.sectionTitle}>My Courses</Text>
            {myCourses.map((item) => (
              <View key={item.id} style={{ marginBottom: 16 }}>
                <TouchableOpacity style={styles.courseRow}>

                  
                    <View style={styles.courseCircleInner}>
                      <Text style={styles.courseCircleText}>
                        {item.title.charAt(0)}
                      </Text>
                    </View>


                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseTitle}>{item.title}</Text>
                  </View>
                  <Ionicons name="play-circle" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.continueButton}>
                  <Text style={styles.continueText}>▶ Continue</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Stats */}
            {/* Streak Card */}
            <Text style={styles.sectionTitle}>Streak</Text>
<View style={styles.streakCard}>

  {/* Header */}
  <View style={styles.streakHeader}>
    <Text style={styles.streakTitle}> Streak</Text>
    <Text style={styles.streakGoal}>Daily goal: 10 mins</Text>
  </View>

  {/* Row with Current + Longest */}
  <View style={styles.streakRow}>
    <View style={styles.streakCol}>
      <Text style={styles.streakLabel}>CURRENT</Text>
      <Text style={[styles.streakValue, { color: "#fff" }]}>7 days</Text>
    </View>

    <View style={styles.streakDivider} />

    <View style={styles.streakCol}>
      <Text style={styles.streakLabel}>LONGEST</Text>
      <Text style={[styles.streakValue, { color: "#fff" }]}>18 days</Text>
    </View>
  </View>
</View>


            
            {/* Calendar (3 weeks) */}
          <View style={styles.calendarContainer}>
            {["27 Jul - 2 Aug", "3 - 9 Aug", "10 - 16 Aug"].map((week, wIdx) => (
              <View key={wIdx} style={styles.weekBlock}>
                <Text style={styles.weekLabel}>{week}</Text>

                <View style={styles.weekRow}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <View key={i} style={styles.dayCol}>
            <View style={styles.dayCircle} />
          </View>
        ))}
      </View>
    </View>
  ))}
</View>

<Text style={styles.sectionTitle}>Stats</Text>
  {/* NEW: Stats Grid */}
  <View style={styles.statsGrid}>
    <View style={styles.statsBox}>
      <Text style={styles.statsBoxTitle}>TOTAL WATCH MINS</Text>
      <Text style={styles.statsBoxValue}>0</Text>
    </View>
    <View style={styles.statsBox}>
      <Text style={styles.statsBoxTitle}>LESSONS COMPLETED</Text>
      <Text style={styles.statsBoxValue}>0</Text>
    </View>
    <View style={styles.statsBox}>
      <Text style={styles.statsBoxTitle}>QUESTIONS ATTEMPTED</Text>
      <Text style={styles.statsBoxValue}>0</Text>
    </View>
    <View style={styles.statsBox}>
      <Text style={styles.statsBoxTitle}>TESTS ATTEMPTED</Text>
      <Text style={styles.statsBoxValue}>0</Text>
    </View>
  </View>
          </>
          
        }
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
      {/* NEW: Streak Calendar */}
  
      {/* Bottom Navbar */}
      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  searchContainer: {
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 20,
    margin: 16,
    marginTop: 45,
  },
  searchInput: { flex: 1, padding: 8, color: "#fff" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 8,
  },

  // new course row
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  streakCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  streakGoal: {
    fontSize: 12,
    color: "#aaa",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  streakCol: {
    flex: 1,
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#bbb",
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  streakDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#444",
  },
  
  
  courseCircleInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface, // WhatsApp green
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  courseCircleText: { color: theme.colors.primary, fontWeight: "700", fontSize: 16 },
  
  courseTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  courseSubtitle: { color: "#aaa", fontSize: 13, marginTop: 4 },

  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    margin: 12,
  },
  continueText: { color: "#fff", fontWeight: "600" },
  statsText: { color: "#fff", fontSize: 16, marginBottom: 6, margin: 16 },
  calendarContainer: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  weekBlock: {
    marginBottom: 12,
  },
  weekLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: "row",   // row of 7 columns
    width: "100%",          // force full row width
  },
  dayCol: {
    flex: 1,                // 🔑 exactly 1/7th of the row
    alignItems: "center",   // center the circle in its column
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#555",
    backgroundColor: "#222", // or use intensity color here
  },
  
  
  
  
  
  
  
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
  },
  statsBox: {
    width: "48%",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statsBoxTitle: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },
  statsBoxValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  
});

export default Home;
