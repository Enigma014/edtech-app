import React, { memo, useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Alert, ActivityIndicator } from 'react-native';
import Background from '../components/BackGround';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';

import { theme } from '../core/theme';
import { emailValidator, passwordValidator, nameValidator } from '../core/utils';
import { Navigation } from '../types';
import useRegisterStore from '@store/RegisterStore/RegisterStore';

type Props = {
  navigation: Navigation;
};

const RegisterScreen = ({ navigation }: Props) => {
  const [name, setName] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });
  const [loading, setLoading] = useState(false);

  const register = useRegisterStore((state) => state.register);

  const _onRegisterPressed = async () => {
    const nameError = nameValidator(name.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    const confirmPasswordError =
      password.value !== confirmPassword.value ? 'Passwords do not match' : '';

    if (nameError || emailError || passwordError || confirmPasswordError) {
      setName({ ...name, error: nameError });
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      setConfirmPassword({ ...confirmPassword, error: confirmPasswordError });
      return;
    }

    setLoading(true);
    try {
      await register(name.value, email.value, password.value);

      Alert.alert(
        'Verify Your Email',
        'A verification link has been sent to your email address. Please verify before logging in.',
        [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
      );
    } catch (err: any) {
      console.error('Registration error:', err);
      Alert.alert('Registration Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <Logo />
      <Header>Create Account.</Header>

      <TextInput
        label="Full Name"
        value={name.value}
        onChangeText={(text) => setName({ value: text, error: '' })}
        error={!!name.error}
        errorText={name.error}
      />

      <TextInput
        label="Email"
        value={email.value}
        onChangeText={(text) => setEmail({ value: text, error: '' })}
        error={!!email.error}
        errorText={email.error}
        autoComplete="email"
      />

      <TextInput
        label="Password"
        value={password.value}
        onChangeText={(text) => setPassword({ value: text, error: '' })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword.value}
        onChangeText={(text) => setConfirmPassword({ value: text, error: '' })}
        error={!!confirmPassword.error}
        errorText={confirmPassword.error}
        secureTextEntry
      />

      <Button
        title={loading ? 'Registering...' : 'Register'}
        onPress={_onRegisterPressed}
        disabled={loading}
      />

      {loading && (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: 4,
  },
  label: {
    color: theme.colors.secondary,
  },
  link: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

export default memo(RegisterScreen);
