import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SignInScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = () => {
    // Implement your sign-in logic here
    console.log('Signing in with:', email, password);
    // Example: navigation.navigate('Home');
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
    backgroundColor: '#fff',
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
    backgroundColor: '#7D0006',
    padding: 30,
    borderRadius: 30,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
  forgotPassword: {
    color: '#fff',
    fontSize: 12,
  },
  continueButton: {
    backgroundColor: '#9c161bff', // A slightly darker red for contrast
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    position: 'absolute',
    bottom: 50,
  },
  signupText: {
    fontSize: 14,
    color: '#7D0006',
  },
  signupLink: {
    color: '#7D0006',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});