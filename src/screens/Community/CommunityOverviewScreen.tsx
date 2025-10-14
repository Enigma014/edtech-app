// CommunityOverviewScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
type CommunityOverviewScreenProps = {
  communityName?: string;
  navigation: StackNavigationProp<any>;
  route: any; // added
};

const CommunityOverviewScreen: React.FC<CommunityOverviewScreenProps> = ({ 
  communityName = "Community",
  navigation,
  route
}) => {
  const { id } = route.params || {}; // get id passed from CreateCommunityScreen
  console.log("CommunityOverview received communityId:", id);

  const handleAddGroup = () => {
    navigation.navigate('ManageGroupsScreen', { id }); // pass id to next screen
  };

  return (
    <ScrollView style={styles.container}>
      {/* Community Header */}
      <View style={styles.header}>
        <Text style={styles.communityName}>{communityName}</Text>
        <Text style={styles.subtitle}>Community · 2 groups</Text>
      </View>

      {/* Announcements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        <View style={styles.groupCard}>
          <Text style={styles.groupName}>Welcome to your community!</Text>
          <Text style={styles.timestamp}>11:09</Text>
        </View>
      </View>

      {/* Groups Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groups you're in</Text>
        
        <View style={styles.groupCard}>
          <Text style={styles.groupName}>General</Text>
          <Text style={styles.groupDescription}>Welcome to the group: General</Text>
          <Text style={styles.timestamp}>11:09</Text>
        </View>

        <Text style={styles.helperText}>
          Other groups added to the community will appear here.
          Community members can join these groups.
        </Text>
      </View>

      {/* Add Group Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddGroup}>
        <Text style={styles.addButtonText}>+ Add group</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
// CommunityOverviewScreen.styles.ts

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 25,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  communityName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  groupCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  addButton: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default CommunityOverviewScreen;