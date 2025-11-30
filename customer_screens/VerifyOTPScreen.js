import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';
import apiService from '../services/apiService';

export default function VerifyOTPScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [otp, setOTP] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Missing OTP', 'Please enter the OTP sent to your email.');
      return;
    }
    setLoading(true);
    try {
      await apiService.verifyPasswordResetOTP(email, otp);
      navigation.navigate('ResetPassword', { email, otp });
    } catch (error) {
      Alert.alert('Invalid OTP', error.message || 'The OTP you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the OTP sent to {email}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOTP}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.h3,
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radii.lg,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.h3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
