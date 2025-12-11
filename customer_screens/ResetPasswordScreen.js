import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';
import apiService from '../services/apiService';
import { ThemedAlert, showThemedAlert } from '../components/ThemedAlert';
import Fontawesome from 'react-native-vector-icons/FontAwesome';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, resetToken } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });

  // Password strength meter
  const getPasswordStrength = (password) => {
    let score = 0;
    if (!password) return { label: 'Enter password', color: '#ccc', score: 0 };
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { label: 'Weak', color: '#d32f2f', score };
    if (score === 3 || score === 4) return { label: 'Medium', color: '#fbc02d', score };
    if (score >= 5) return { label: 'Strong', color: '#388e3c', score };
    return { label: 'Weak', color: '#d32f2f', score };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showThemedAlert(setAlert, 'Missing Fields', 'Please enter and confirm your new password.');
      return;
    }
    if (password.length < 8) {
      showThemedAlert(setAlert, 'Error', 'Password must be at least 8 characters long');
      return;
    }
    if (passwordStrength.label === 'Weak') {
      showThemedAlert(setAlert, 'Weak Password', 'Please choose a stronger password.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one special character.');
      return;
    }
    if (password !== confirmPassword) {
      showThemedAlert(setAlert, 'Password Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiService.changePassword(email, resetToken, password);
      showThemedAlert(setAlert, 'Success', 'Your password has been reset.', [
        {
          text: 'OK',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] }),
        },
      ]);
    } catch (error) {
      console.log('Reset password error:', error);
      showThemedAlert(setAlert, 'Error', error.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your new password.</Text>

      {/* Password requirements description */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Password requirements:</Text>
        <Text style={styles.requirement}>• At least 8 characters</Text>
        <Text style={styles.requirement}>• Contains uppercase and lowercase letters</Text>
        <Text style={styles.requirement}>• Contains a number</Text>
        <Text style={styles.requirement}>• Contains a special character</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            style={[
              styles.input,
              { color: '#222', fontFamily: undefined, flex: 1, paddingRight: 40 }
            ]}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Fontawesome 
              name={showPassword ? 'eye-slash' : 'eye'} 
              size={20} 
              color="#000" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Password strength meter */}
      {password.length > 0 && (
        <View style={styles.strengthMeterContainer}>
          <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color, width: `${passwordStrength.score * 20}%` }]} />
          <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry={!showConfirmPassword}
            style={[
              styles.input,
              { color: '#222', fontFamily: undefined, flex: 1, paddingRight: 40 }
            ]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((prev) => !prev)}
            style={{
              position: 'absolute',
              right: 10,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 4,
            }}
            accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Fontawesome 
              name={showConfirmPassword ? 'eye-slash' : 'eye'} 
              size={20} 
              color="#000" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {passwordStrength.label === 'Weak' && password.length > 0 && (
        <Text style={styles.weakPasswordWarning}>
          Your password is too weak. Please choose a stronger password.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Reset Password</Text>}
      </TouchableOpacity>

      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />
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
  inputContainer: {
    marginBottom: Spacing.md,
    width: '100%',
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
  requirementsContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    width: '100%',
  },
  requirementsTitle: {
    fontSize: Typography.small,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  requirement: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  strengthMeterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  strengthBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 10,
    minWidth: 40,
    maxWidth: 100,
    flexGrow: 1,
  },
  strengthLabel: {
    fontSize: Typography.small,
    fontWeight: 'bold',
    minWidth: 60,
  },
  weakPasswordWarning: {
    color: '#d32f2f',
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: Typography.small,
    width: '100%',
  },
});
