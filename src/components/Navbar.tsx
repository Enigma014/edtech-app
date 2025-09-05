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
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ChatScreen')}>
      <Ionicons name="chatbubble-outline" size={24} color={'#000'}  />
      <Text style={styles.label}>Chats</Text>
    </TouchableOpacity>
  
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductScreen')}>
      <Ionicons name="bag-outline" size={24} color={'#000'} />
      <Text style={styles.label}>Products</Text>
    </TouchableOpacity>
  
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CommunityScreen')}>
      <Ionicons name="people-outline" size={24} color={'#000'} />
      <Text style={styles.label}>Community</Text>
    </TouchableOpacity>
  
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SettingsScreen')}>
      <Ionicons name="settings-outline" size={24} color={'#000'} />
      <Text style={styles.label}>Settings</Text>
    </TouchableOpacity>
    
  </View>
  
  
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    boxShadow: '0 -2px 5px rgba(0,0,0,0.1)',
  },
  navItem: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
  },
});

export default Navbar;
