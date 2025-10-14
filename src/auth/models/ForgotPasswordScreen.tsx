import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Background from '../../components/BackGround';
import Logo from '../../components/Logo';
import Header from '../../components/Header';
import Button from '../../components/Button';
import TextInput from '../../components/TextInput';
import { theme } from '../../core/theme';
import { emailValidator } from '../../core/utils';
import { Navigation } from '../../types';
import { authService } from '@utils/firebaseConfig';

type Props = {
  navigation: Navigation;
};

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [loading, setLoading] = useState(false);

  const _onResetPasswordPressed = async () => {
    const emailError = emailValidator(email.value);
    if (emailError) {
      setEmail({ ...email, error: emailError });
      return;
    }

    setLoading(true);

    try {
      await authService.sendPasswordResetEmail(email.value.trim());
      setLoading(false);
      Alert.alert(
        'Success',
        'Password reset email sent. Check your inbox.',
        [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('Forgot password error:', error);

      let errorMessage = 'Failed to send reset email.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Try again later.';
          break;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <Background>
      <Logo />
      <Header>Forgot Password?</Header>

      <TextInput
        label="Email"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: '' })}
        error={!!email.error}
        errorText={email.error}
        autoComplete="email"
      />

      <Button
        title={loading ? 'Sending...' : 'Reset Password'}
        onPress={_onResetPasswordPressed}
        disabled={loading}
      />

      {loading && (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Remember your password? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
