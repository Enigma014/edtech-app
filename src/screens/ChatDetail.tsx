import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BackButton from '../components/BackButton';

// ✅ FIX: styles moved ABOVE component to avoid "used before declaration" error
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 100,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  contactInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: -200 },
  contactIcon: { marginLeft: -10 },
  contactName: { color: '#000', fontSize: 20, marginLeft: 2 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  chatArea: { flex: 1 },

  bottomWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingBottom: Platform.OS === 'ios' ? 5 : 0,
    backgroundColor: '#ECE5DD',
  },
  inputBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 25,
    paddingHorizontal: 10,
  },
  textInput: { flex: 1, paddingHorizontal: 10, fontSize: 16, color: 'black' },
  icon: { marginHorizontal: 5 },
  micButton: {
    backgroundColor: '#25d366',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});



  const ChatDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
    const { name } = route.params;
    const [message, setMessage] = useState('');
  
    const handleSend = () => {
      if (message.trim() !== '') {
        console.log('Sending message:', message);
        setMessage('');
      }
    };
  
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100} // adjust according to header
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton goBack={() => navigation.navigate('ChatScreen')} />
            <View style={styles.contactInfo}>
              <Icon name="account-circle" size={40} color="gray" style={styles.contactIcon} />
              <Text style={styles.contactName}>{name}</Text>
            </View>
            <View style={styles.headerIcons}>
              <Icon name="phone-outline" size={24} color="gray" style={styles.icon} />
              <Icon name="dots-vertical" size={24} color="gray" />
            </View>
          </View>
  
          {/* Chat area */}
          <View style={styles.chatArea}></View>
  
          {/* Bottom Input */}
          <View style={styles.bottomWrapper}>
            <View style={styles.inputBar}>
              <Icon name="emoticon-outline" size={28} color="gray" style={styles.icon} />
              <TextInput
                placeholder="Message"
                style={styles.textInput}
                placeholderTextColor="gray"
                value={message}
                onChangeText={setMessage}
              />
              <Icon name="paperclip" size={28} color="gray" style={styles.icon} />
              <Icon name="camera-outline" size={28} color="gray" style={styles.icon} />
            </View>
  
            <TouchableOpacity
              style={styles.micButton}
              onPress={message.trim() ? handleSend : undefined}
            >
              <Icon
                name={message.trim() ? 'send' : 'microphone'}
                size={22}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  };
  

export default ChatDetailScreen;
