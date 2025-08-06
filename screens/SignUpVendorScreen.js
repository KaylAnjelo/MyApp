import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import CheckBox from '@react-native-community/checkbox';
import { useNavigation } from '@react-navigation/native';

export default function SignUpVendorScreen() {
  const navigation = useNavigation();
  const [agree, setAgree] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color="#fff" />
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

        <Text style={styles.sectionLabel}>Contact Details</Text>

        {/* Phone Input */}
        <View style={styles.row}>
          <Image
            source={require('../assets/ph_flag.png')}
            style={styles.flagIcon}
          />
          <Text style={styles.prefix}>+63</Text>
          <TextInput
            placeholder="Mobile Number"
            style={styles.phoneInput}
            keyboardType="phone-pad"
          />
        </View>

        {/* Other fields */}
        <TextInput placeholder="First Name" style={styles.input} />
        <TextInput placeholder="Last Name" style={styles.input} />
        <TextInput placeholder="Password" secureTextEntry style={styles.input} />

        {/* Terms Checkbox */}
        <View style={styles.checkboxRow}>
          <CheckBox value={agree} onValueChange={setAgree} />
          <Text style={styles.checkboxText}>
            I have read and understood the{' '}
            <Text style={styles.link}>Privacy Policy</Text> and{' '}
            <Text style={styles.link}>Terms and Condition</Text>
          </Text>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>

        {/* OR */}
        <Text style={styles.orText}>or</Text>

        {/* Google Sign-In */}
        <TouchableOpacity style={styles.googleButton}>
          <Image
            source={require('../assets/google_logo.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#7D0006',
    paddingTop: 50,
    paddingHorizontal: 25,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    position: 'relative',
  },
  headerTopRow: {
    position: 'absolute',
    top: 50,
    left: 25,
  },
  vendorIcon: {
    width: 35,
    height: 35,
    marginTop: 10,
    resizeMode: 'contain',
  },
  vendorLabel: {
    color: '#fff',
    marginTop: 5,
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 25,
    paddingTop: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
    marginBottom: 20,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 10,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 5,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 5,
    resizeMode: 'contain',
  },
  prefix: {
    marginRight: 10,
    fontSize: 14,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    marginBottom: 15,
    fontSize: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#000',
  },
  link: {
    color: '#7D0006',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  signupButton: {
    backgroundColor: '#7D0006',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  orText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 12,
    color: '#777',
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
