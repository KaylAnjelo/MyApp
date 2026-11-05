import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';

const CUSTOMER_SCREENS = [
  { name: 'HomePage', label: 'Customer Home Page' },
  { name: 'Stores', label: 'Stores List' },
  { name: 'SpecificStore', label: 'Specific Store' },
  { name: 'AllProducts', label: 'All Products' },
  { name: 'MyPoints', label: 'My Points' },
  { name: 'MyRewards', label: 'My Rewards' },
  { name: 'ProfilePage', label: 'Customer Profile' },
  { name: 'ActivityScreen', label: 'Customer Activity' },
  { name: 'ScannerScreen', label: 'QR Scanner Screen' },
  { name: 'PointsHistory', label: 'Points History' },
  { name: 'TransactionDetails', label: 'Transaction Details' },
  { name: 'Notifications', label: 'Notifications' },
];

const VENDOR_SCREENS = [
  { name: 'VendorHomePage', label: 'Vendor Home Page' },
  { name: 'SalesPage', label: 'Vendor Sales Page' },
  { name: 'VendorProfilePage', label: 'Vendor Profile' },
  { name: 'TransactionPage', label: 'Vendor Transactions' },
  { name: 'CreateOrder', label: 'Create Order / Add Menu' },
  { name: 'VTransactionDetail', label: 'Vendor Transaction Detail' },
];

const AUTH_SCREENS = [
  { name: 'Launch', label: 'Launch Screen' },
  { name: 'GetStarted', label: 'Get Started Screen' },
  { name: 'SignIn', label: 'Sign In Screen' },
  { name: 'SignUp', label: 'Sign Up (User Type)' },
  { name: 'SignUpCustomer', label: 'Sign Up Customer' },
  { name: 'SignUpVendor', label: 'Sign Up Vendor' },
  { name: 'ChangePassword', label: 'Change Password' },
  { name: 'ForgotPassword', label: 'Forgot Password' },
  { name: 'VerifyOTP', label: 'Verify OTP' },
  { name: 'ResetPassword', label: 'Reset Password' },
];

export default function DevScreenMenu() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'vendor' | 'auth'

  const getScreens = () => {
    if (activeTab === 'customer') return CUSTOMER_SCREENS;
    if (activeTab === 'vendor') return VENDOR_SCREENS;
    return AUTH_SCREENS;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dev Screen Navigator</Text>
      <Text style={styles.subHeader}>Select a category and tap any screen to open it:</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customer' && styles.activeTab]}
          onPress={() => setActiveTab('customer')}
        >
          <Text style={[styles.tabText, activeTab === 'customer' && styles.activeTabText]}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendor' && styles.activeTab]}
          onPress={() => setActiveTab('vendor')}
        >
          <Text style={[styles.tabText, activeTab === 'vendor' && styles.activeTabText]}>Vendor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'auth' && styles.activeTab]}
          onPress={() => setActiveTab('auth')}
        >
          <Text style={[styles.tabText, activeTab === 'auth' && styles.activeTabText]}>Auth & Launch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {getScreens().map((screen) => (
          <TouchableOpacity
            key={screen.name}
            style={styles.button}
            onPress={() => {
              try {
                navigation.navigate(screen.name);
              } catch (e) {
                alert('Error navigating to ' + screen.name + ': ' + e.message);
              }
            }}
          >
            <Text style={styles.buttonTitle}>{screen.label}</Text>
            <Text style={styles.buttonSubtitle}>{screen.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
    borderRadius: Radii.md,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontSize: Typography.small,
  },
  activeTabText: {
    color: Colors.white,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
  },
  buttonTitle: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.body,
  },
  buttonSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.small,
    marginTop: 2,
  },
});
