import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';

const MOCK_CUSTOMER = {
  user_id: 'dev-customer-id',
  username: 'testcustomer',
  role: 'customer',
  email: 'customer@test.com',
  first_name: 'Test',
  last_name: 'Customer',
};

const MOCK_VENDOR = {
  user_id: 'dev-vendor-id',
  username: 'testvendor',
  role: 'vendor',
  email: 'vendor@test.com',
  first_name: 'Test',
  last_name: 'Vendor',
};

const AUTH_SCREENS = [
  { name: 'Launch', label: 'Launch Screen' },
  { name: 'GetStarted', label: 'Get Started Screen' },
  { name: 'SignIn', label: 'Sign In Screen' },
  { name: 'SignUp', label: 'Sign Up (User Type)' },
  { name: 'SignUpCustomer', label: 'Sign Up Customer' },
  { name: 'SignUpVendor', label: 'Sign Up Vendor' },
  { name: 'ForgotPassword', label: 'Forgot Password' },
  { name: 'VerifyOTP', label: 'Verify OTP' },
  { name: 'ResetPassword', label: 'Reset Password' },
];

export default function DevScreenMenu() {
  const navigation = useNavigation();
  const [showAuthScreens, setShowAuthScreens] = useState(false);

  const handleNavigate = async (userType) => {
    try {
      const isCustomer = userType === 'customer';
      const mockUser = isCustomer ? MOCK_CUSTOMER : MOCK_VENDOR;
      const homeScreen = isCustomer ? 'HomePage' : 'VendorHomePage';
      await AsyncStorage.setItem('@app_user', JSON.stringify(mockUser));
      navigation.navigate(homeScreen);
    } catch (e) {
      alert('Error opening ' + userType + ' home: ' + e.message);
    }
  };

  const handleAuthNavigate = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (e) {
      alert('Error navigating to ' + screenName + ': ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dev Screen Navigator</Text>
      <Text style={styles.subHeader}>Choose a screen to open:</Text>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => handleNavigate('customer')}
        >
          <Text style={styles.optionText}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => handleNavigate('vendor')}
        >
          <Text style={styles.optionText}>Vendor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, showAuthScreens && styles.authOptionExpanded]}
          onPress={() => setShowAuthScreens(!showAuthScreens)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showAuthScreens }}
        >
          <Text style={styles.optionText}>Auth & Launch</Text>
          {showAuthScreens && (
            <Ionicons name="chevron-up" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {showAuthScreens && (
        <ScrollView contentContainerStyle={styles.authScreens}>
          {AUTH_SCREENS.map((screen) => (
            <TouchableOpacity
              key={screen.name}
              style={styles.authScreen}
              onPress={() => handleAuthNavigate(screen.name)}
            >
              <Text style={styles.authScreenText}>{screen.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 50,
  },
  header: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'column',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  option: {
    width: '100%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginBottom: Spacing.sm,
    borderRadius: Radii.md,
  },
  optionText: {
    fontWeight: 'bold',
    color: Colors.white,
    fontSize: Typography.body,
  },
  authOptionExpanded: {
    gap: Spacing.xs,
  },
  authScreens: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  authScreen: {
    backgroundColor: '#e0e0e0',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radii.md,
  },
  authScreenText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: Typography.body,
    textAlign: 'center',
  },
});
