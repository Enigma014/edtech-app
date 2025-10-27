// src/screens/LoginScreen.tsx
import React, { memo, useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View, Alert } from 'react-native';
import Background from '../components/BackGround';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import { theme } from '../core/theme';
import { emailValidator, passwordValidator } from '../core/utils';
import { Navigation } from '../types';
import { authService, db } from '@utils/firebaseConfig';

type Props = {
  navigation: Navigation;
};

// Password strength checker function
// const checkPasswordStrength = (password: string) => {
//   if (!password) return { strength: 'none', score: 0, feedback: [] };

//   const feedback: string[] = [];
//   let score = 0;

//   // Length check
//   if (password.length >= 8) {
//     score += 1;
//   } else {
//     feedback.push('At least 8 characters');
//   }

//   // Lowercase check
//   if (/[a-z]/.test(password)) {
//     score += 1;
//   } else {
//     feedback.push('One lowercase letter');
//   }

//   // Uppercase check
//   if (/[A-Z]/.test(password)) {
//     score += 1;
//   } else {
//     feedback.push('One uppercase letter');
//   }

//   // Number check
//   if (/\d/.test(password)) {
//     score += 1;
//   } else {
//     feedback.push('One number');
//   }

//   // Special character check
//   if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
//     score += 1;
//   } else {
//     feedback.push('One special character');
//   }

//   // Determine strength level
//   let strength: 'weak' | 'fair' | 'good' | 'strong' | 'none' = 'none';
//   if (score <= 2) strength = 'weak';
//   else if (score === 3) strength = 'fair';
//   else if (score === 4) strength = 'good';
//   else if (score === 5) strength = 'strong';

//   return { strength, score, feedback };
// };

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [loading, setLoading] = useState(false);
  //const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  //const passwordStrength = checkPasswordStrength(password.value);

  const _onLoginPressed = async () => {
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting Firebase login...');

      // ✅ Sign in with Firebase Auth
      const userCredential = await authService.signInWithEmailAndPassword(
        email.value.trim(),
        password.value
      );

      const user = userCredential.user;
      await user.reload(); // refresh user state

      // ⚠️ Check if email is verified
      if (!user.emailVerified) {
        setLoading(false);
        Alert.alert(
          'Email Not Verified',
          'Your email is not verified yet. Please check your inbox.',
          [
            {
              text: 'Resend Email',
              onPress: async () => {
                try {
                  await user.sendEmailVerification();
                  Alert.alert('Sent', 'Verification email has been resent.');
                } catch (err: any) {
                  console.error(err);
                  Alert.alert('Error', err.message || 'Failed to resend email.');
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }

      // ✅ Email verified, allow login
      setLoading(false);
      navigation.navigate('ChatScreen');

    } catch (error: any) {
      setLoading(false);
      console.error('Login error:', error);

      let errorMessage = 'Login failed. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  // const getStrengthColor = () => {
  //   switch (passwordStrength.strength) {
  //     case 'weak': return '#ff4444';
  //     case 'fair': return '#ffaa00';
  //     case 'good': return '#00aa00';
  //     case 'strong': return '#008800';
  //     default: return theme.colors.secondary;
  //   }
  // };

  // const getStrengthText = () => {
  //   switch (passwordStrength.strength) {
  //     case 'weak': return 'Weak';
  //     case 'fair': return 'Fair';
  //     case 'good': return 'Good';
  //     case 'strong': return 'Strong';
  //     default: return '';
  //   }
  // };

  return (
    <Background>
      <Logo />
      <Header>Welcome back.</Header>

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
        onChangeText={(text) => {
          setPassword({ value: text, error: '' });
          // setShowPasswordStrength(text.length > 0);
        }}
        // onBlur={() => setShowPasswordStrength(false)}
        // onFocus={() => setShowPasswordStrength(true)}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />

      {/* Password Strength Indicator
      {showPasswordStrength && password.value.length > 0 && (
        <View style={styles.passwordStrengthContainer}>
          <View style={styles.strengthBar}>
            <View 
              style={[
                styles.strengthFill, 
                { 
                  width: `${(passwordStrength.score / 5) * 100}%`,
                  backgroundColor: getStrengthColor()
                }
              ]} 
            />
          </View>
          <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
            Password Strength: {getStrengthText()}
          </Text>
          {passwordStrength.feedback.length > 0 && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackTitle}>Requirements:</Text>
              {passwordStrength.feedback.map((item, index) => (
                <Text key={index} style={styles.feedbackItem}>• {item}</Text>
              ))}
            </View>
          )}
        </View>
      )} */}

      <View style={styles.forgotPassword}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPasswordScreen')}
        >
          <Text style={styles.label}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>

      <Button 
        title={loading ? 'Logging in...' : 'Login'} 
        onPress={_onLoginPressed} 
        disabled={loading}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={styles.link}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 8,
  },
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
  passwordStrengthContainer: {
    width: '100%',
    marginBottom: 16,
    marginTop: 8,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  feedbackItem: {
    fontSize: 11,
    color: theme.colors.secondary,
    marginLeft: 4,
  },
});

export default memo(LoginScreen);