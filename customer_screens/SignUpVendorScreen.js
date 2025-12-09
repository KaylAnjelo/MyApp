import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Switch, ActivityIndicator, Platform } from 'react-native';
import { ThemedAlert, showThemedAlert } from '../components/ThemedAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';
import apiService from '../services/apiService'; // replace with your actual API service
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function SignUpVendorScreen() {
  const navigation = useNavigation();
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    storeCode: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

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

  const passwordStrength = getPasswordStrength(formData.password);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendOTP = async () => {
    if (!formData.storeCode || !formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password) {
      showThemedAlert(setAlert, 'Error', 'Please fill in all fields including store code');
      return;
    }

    if (passwordStrength.label === 'Weak') {
      showThemedAlert(setAlert, 'Weak Password', 'Please choose a stronger password.');
      return;
    }

    // Enforce password requirements
    if (formData.password.length < 8) {
      showThemedAlert(setAlert, 'Error', 'Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      showThemedAlert(setAlert, 'Error', 'Password must contain at least one special character.');
      return;
    }

    if (!agree) {
      showThemedAlert(setAlert, 'Error', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      await apiService.sendOTP(formData.email.trim().toLowerCase());
      setOtpSent(true);
      showThemedAlert(setAlert, 'Success', 'Verification code sent to your email!');
    } catch (error) {
      showThemedAlert(setAlert, 'Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignUp = async () => {
    if (!otp || otp.length !== 6) {
      showThemedAlert(setAlert, 'Error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      // Vendor registration with store code verification and OTP
      const userData = {
        email: formData.email.trim().toLowerCase(),
        otp: otp,
        store_code: formData.storeCode.trim(),
        username: formData.email.trim().toLowerCase(),
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        contact_number: formData.phone
      };

      const response = await apiService.verifyOTPAndRegisterVendor(userData);

      console.log('Vendor registration successful:', response);
      
      // Save user data to AsyncStorage
      if (response.user) {
        await AsyncStorage.setItem('@app_user', JSON.stringify(response.user));
      }
      
      showThemedAlert(setAlert, 'Success', `Account created successfully! You are now registered for ${response.user?.store_name || 'the store'}.`, [
        { text: 'OK', onPress: () => navigation.replace("VendorHomePage", { user: response.user }) }
      ]);

    } catch (error) {
      if (error.message.includes("Invalid store code")) {
        showThemedAlert(setAlert, "Registration Failed", "The store code you entered is invalid. Please check with your store manager.");
      } else if (error.message.includes("Invalid verification code") || error.message.includes("OTP")) {
        showThemedAlert(setAlert, "Verification Failed", "Invalid or expired verification code. Please try again.");
      } else if (error.message.includes("duplicate key") || error.message.includes("already")) {
        showThemedAlert(setAlert, "Registration Failed", "This email or username is already registered.");
      } else if (error.message.includes("inactive")) {
        showThemedAlert(setAlert, "Registration Failed", "This store is currently inactive. Please contact support.");
      } else {
        showThemedAlert(setAlert, "Registration Failed", error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid
      extraScrollHeight={40}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Image
            source={require('../assets/white_vendor.png')}
            style={styles.vendorIcon}
          />
          <Text style={styles.vendorLabel}>Vendor</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subtitle}>
            To initiate your journey, kindly proceed to fill-up form.
          </Text>

          <Text style={styles.sectionLabel}>Store Verification</Text>

          <TextInput 
            placeholder="Store Code (provided by store manager)" 
            style={styles.input}
            placeholderTextColor="#888"
            autoCapitalize="characters"
            value={formData.storeCode}
            onChangeText={(value) => handleInputChange('storeCode', value)}
          />

          <Text style={styles.sectionLabel}>Contact Details</Text>

          <TextInput 
            placeholder="First Name" 
            style={styles.input}
            placeholderTextColor="#888"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />
          <TextInput 
            placeholder="Last Name" 
            style={styles.input}
            placeholderTextColor="#888"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />
          <TextInput 
            placeholder="Phone" 
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={13}
            value={formData.phone}
            onChangeText={(value) => {
              // Remove all non-numeric characters
              const numericValue = value.replace(/[^0-9]/g, '');
              
              // Format: XXXX XXX XXXX
              let formatted = numericValue;
              if (numericValue.length > 4 && numericValue.length <= 7) {
                formatted = numericValue.slice(0, 4) + ' ' + numericValue.slice(4);
              } else if (numericValue.length > 7) {
                formatted = numericValue.slice(0, 4) + ' ' + numericValue.slice(4, 7) + ' ' + numericValue.slice(7, 11);
              }
              
              handleInputChange('phone', formatted);
            }}
          />
          <TextInput 
            placeholder="Email" 
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
            <TextInput 
              placeholder="Password"
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1, paddingRight: 40 }]}
              placeholderTextColor="#888"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
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
              <Icon 
                name={showPassword ? 'eye-slash' : 'eye'} 
                size={20} 
                color='#000' 
              />
            </TouchableOpacity>
          </View>

          {/* Password requirements */}
          {formData.password.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password requirements:</Text>
              <Text style={styles.requirement}>• At least 8 characters</Text>
              <Text style={styles.requirement}>• Contains uppercase and lowercase letters</Text>
              <Text style={styles.requirement}>• Contains a number</Text>
              <Text style={styles.requirement}>• Contains a special character</Text>
            </View>
          )}

          {/* Password strength meter */}
          {formData.password.length > 0 && (
            <View style={styles.strengthMeterContainer}>
              <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color, width: `${passwordStrength.score * 20}%` }]} />
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
            </View>
          )}

          {/* Weak password warning */}
          {passwordStrength.label === 'Weak' && formData.password.length > 0 && (
            <Text style={styles.weakPasswordWarning}>
              Your password is too weak. Please choose a stronger password.
            </Text>
          )}

          {/* Terms Switch */}
          <View style={styles.checkboxRow}>
            <Switch value={agree} onValueChange={setAgree} />
            <Text style={styles.checkboxText}>
              I have read and understood the{' '}
              <Text style={styles.link}>Privacy Policy</Text> and{' '}
              <Text style={styles.link}>Terms and Condition</Text>
            </Text>
          </View>

          {/* OTP Input Field (shown after OTP is sent) */}
          {otpSent && (
            <>
              <Text style={styles.otpLabel}>Verification Code</Text>
              <Text style={styles.otpSubtext}>
                Enter the 6-digit code sent to {formData.email}
              </Text>
              <TextInput 
                placeholder="000000" 
                style={[styles.input, styles.otpInput]}
                placeholderTextColor="#888"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity onPress={handleSendOTP}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={otpSent ? handleVerifyAndSignUp : handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.signupText}>
                {otpSent ? 'Verify & Sign Up' : 'Send Verification Code'}
              </Text>
          )}
        </TouchableOpacity>
        </View>
      </View>
      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />
    </KeyboardAwareScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    alignItems: 'center',
    position: 'relative',
  },
  headerTopRow: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
  },
  vendorIcon: {
    width: 35,
    height: 35,
    marginTop: 10,
    resizeMode: 'contain',
  },
  vendorLabel: {
    color: Colors.white,
    marginTop: Spacing.xs,
    fontSize: Typography.body,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.md,
    fontSize: Typography.body,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  checkboxText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.small,
    color: Colors.textPrimary,
  },
  link: {
    color: Colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  signupButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    borderRadius: Radii.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  signupText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.body,
  },
  otpLabel: {
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    fontSize: Typography.body,
    color: Colors.primary,
  },
  otpSubtext: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 5,
    fontWeight: 'bold',
  },
  resendText: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: Typography.small,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  strengthMeterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
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
  requirementsContainer: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
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
  weakPasswordWarning: {
    color: '#d32f2f',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: Typography.small,
  },
  orText: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontSize: Typography.small,
    color: '#777',
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: Spacing.lg,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.md,
  },
  googleText: {
    fontSize: Typography.body,
    fontWeight: '500',
  },
});
