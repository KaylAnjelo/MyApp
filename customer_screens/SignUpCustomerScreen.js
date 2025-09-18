import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Switch, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';
import apiService from '../services/apiService'; // replace with your actual API service

export default function SignUpCustomerScreen() {
  const navigation = useNavigation();
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!agree) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        user_type: 'customer',
        full_name: `${formData.firstName} ${formData.lastName}`
      };

      const response = await apiService.register(userData);

      console.log('Registration successful:', response);
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.replace("HomePage") }
      ]);

    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Image
          source={require('../assets/white_customer.png')}
          style={styles.vendorIcon}
        />
        <Text style={styles.vendorLabel}>Customer</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>
          To initiate your journey, kindly proceed to fill-up form.
        </Text>

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
          value={formData.phone}
          onChangeText={(value) => {
            const numericValue = value.replace(/[^0-9]/g, '');
              handleInputChange('phone', numericValue);}}
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
        <TextInput 
          placeholder="Password" 
          secureTextEntry 
          style={styles.input}
          placeholderTextColor="#888"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
        />

        {/* Terms Switch */}
        <View style={styles.checkboxRow}>
          <Switch value={agree} onValueChange={setAgree} />
          <Text style={styles.checkboxText}>
            I have read and understood the{' '}
            <Text style={styles.link}>Privacy Policy</Text> and{' '}
            <Text style={styles.link}>Terms and Condition</Text>
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity 
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.signupText}>Sign Up</Text>
          )}
        </TouchableOpacity>


      </View>
    </View>
  );
}

// Styles remain the same as Vendor screen
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
  signupButtonDisabled: {
    opacity: 0.6,
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
