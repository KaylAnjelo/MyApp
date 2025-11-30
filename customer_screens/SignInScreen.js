import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Image, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';
import apiService from '../services/apiService';

export default function SignInScreen() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert('Missing Fields', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.login(username, password);
      console.log('Login successful:', response);

      // Save user data to AsyncStorage for profile screen
      if (response.user) {
        await AsyncStorage.setItem('@app_user', JSON.stringify(response.user));
      }

      // Check must_change_password flag
      if (response.user?.must_change_password) {
        navigation.replace('ChangePassword', { userId: response.user.user_id });
        return;
      }

      // Get role from response (adjust if API sends it differently)
      const userRole = response.user?.role;

      if (userRole === 'vendor') {
        navigation.replace('VendorHomePage', { user: response.user });
      } else {
        navigation.replace('HomePage', { user: response.user });
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
  <KeyboardAvoidingView 
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView 
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled">

      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo_maroon.png')}
            style={styles.logoImage}
            resizeMode="contain"/>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          <View style={styles.inputContainer}><TextInput
              placeholder="Username"
              placeholderTextColor="#888"
              style={styles.input}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}/>
          </View>

          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}><TextInput
                placeholder={`Password (${showPassword ? 'hide' : 'show'})`}
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                style={[
                  styles.input,
                  { color: '#222', fontFamily: undefined, flex: 1, paddingRight: 40 }
                ]}

                value={password}
                onChangeText={setPassword}/><TouchableOpacity

                onPress={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: 10,
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 4,
                }}

                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>

                <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 18 }}>{showPassword ? '🙈' : '👀'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: "#fff", true: "#fff" }}
                thumbColor="#7D0006"/>
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.continueButtonDisabled]} 
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}> Sign up here</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  formContainer: {
    backgroundColor: Colors.primary,
    padding: Spacing.xxl,
    borderRadius: Radii.xl,
    width: '90%',
    ...Shadows.medium,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.white,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.h3,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    color: Colors.white,
    marginLeft: Spacing.xs,
    fontSize: Typography.small,
  },
  forgotPassword: {
    color: Colors.white,
    fontSize: Typography.small,
  },
  continueButton: {
    backgroundColor: '#9c161bff', 
    paddingVertical: Spacing.xl,
    borderRadius: Radii.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  continueButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.h3,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    position: 'absolute',
    bottom: 50,
  },
  signupText: {
    fontSize: Typography.body,
    color: Colors.primary,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
