import React, { useState } from 'react';
import CheckBox from '@react-native-community/checkbox';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';

export default function SignUpUserTypeScreen() {
  const navigation = useNavigation();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1; // 1-9
    const b = Math.floor(Math.random() * 9) + 1;
    const q = `${a} + ${b}`;
    const ans = a + b;
    setCaptchaQuestion(q);
    setCaptchaAnswer(ans);
    setUserInput('');
    setError('');
  };

  const handleUserTypePress = (type) => {
    setSelectedUser(type);
    generateCaptcha();
    setShowCaptcha(true);
  };

  const verifyCaptcha = () => {
    const parsed = parseInt(userInput, 10);
    if (!Number.isFinite(parsed) || isNaN(parsed)) {
      setError('Please enter a valid number');
      return;
    }
    if (parsed === captchaAnswer) {
      setShowCaptcha(false);
      setError('');
      if (selectedUser === 'Customer') navigation.navigate('SignUpCustomer');
      if (selectedUser === 'Vendor') navigation.navigate('SignUpVendor');
    } else {
      setError('Incorrect answer. Try again.');
      generateCaptcha();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Please select your user type.</Text>

        <TouchableOpacity style={styles.button}
          onPress={() => handleUserTypePress('Customer')}>
          <Image
            source={require('../assets/black_customer.png')}
            style={styles.imageIcon}
          />
          <Text style={styles.buttonText}>Customer</Text>
        </TouchableOpacity>

        {/* Vendor Button (already had onPress) */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleUserTypePress('Vendor')}>
          <Image
            source={require('../assets/black_vendor.png')}
            style={styles.imageIcon}
          />
          <Text style={styles.buttonText}>Vendor</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCaptcha}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCaptcha(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify you're human</Text>
            <Text style={styles.captchaQuestion}>{captchaQuestion} = ?</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Answer"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={() => { setShowCaptcha(false); setError(''); }}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={verifyCaptcha}>
                <Text style={styles.modalButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer with pressable "Sign in here" */}
      <Text style={styles.footer}>
        Already have an account?{' '}
        <Text
          style={styles.signIn}
          onPress={() => navigation.navigate('SignIn')}>
          Sign in here
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  topSection: {
    backgroundColor: Colors.primary,
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.h1,
    fontWeight: 'bold',
    marginTop: Spacing.lg,
  },
  subtitle: {
    color: Colors.white,
    fontSize: Typography.body,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.xl,
    marginBottom: Spacing.xl,
  },
  imageIcon: {
    width: 24,
    height: 24,
    marginRight: Spacing.md,
    resizeMode: 'contain',
  },
  buttonText: {
    fontSize: Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: Colors.primary,
    fontSize: Typography.small,
    marginBottom: 200,
  },
  signIn: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  captchaQuestion: {
    fontSize: Typography.h2,
    color: Colors.textPrimary,
    marginVertical: Spacing.sm,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    textAlign: 'center',
    fontSize: Typography.body,
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
  },
  errorText: {
    color: '#D9534F',
    marginTop: Spacing.xs,
    fontSize: Typography.small,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  modalButton: {
    flex: 0,
    width: '42%',
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});

