// src/components/Navbar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { theme } from '../core/theme';
import { Navigation } from '../types';

type Props = {
  navigation: Navigation;
};

const Navbar = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HomeScreen')}>
        <Ionicons name="home-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductScreen')}>
        <Feather name="shopping-bag" size={20} color={theme.colors.primary} />
        <Text style={styles.label}>Products</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('UpdatesScreen')}>
        <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.label}>Updates</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityScreen')}>
        <FontAwesome name="users" size={20} color={theme.colors.primary} />
        <Text style={styles.label}>Community</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary,
  },
  navItem: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
  },
});

export default Navbar;
