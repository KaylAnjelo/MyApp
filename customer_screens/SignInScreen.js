import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';

export default function SignInScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = () => {
    // This is the line that will navigate you to the HomePage
    navigation.navigate('HomePage');
    
    // You can keep your sign-in logic here after this line if you have any
    console.log('Signing in with:', email, password);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo_maroon.png')} style={styles.logoImage} resizeMode="contain" />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.optionsRow}>
          <View style={styles.rememberMeContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: "#fff", true: "#fff" }}
              thumbColor={rememberMe ? "#7D0006" : "#7D0006"}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
          </View>
          <TouchableOpacity onPress={() => console.log('Forgot Password Pressed')}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* This button now calls the updated handleSignIn function */}
        <TouchableOpacity style={styles.continueButton} onPress={handleSignIn}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupLink}> Sign up here</Text>
        </TouchableOpacity>
      </View>
    </View>
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