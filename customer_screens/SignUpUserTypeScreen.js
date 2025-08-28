import CheckBox from '@react-native-community/checkbox';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Colors, Typography, Spacing, Radii } from '../styles/theme';

export default function SignUpUserTypeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Please select your user type.</Text>

        <TouchableOpacity style={styles.button}
          onPress={() => navigation.navigate('SignUpCustomer')}>
          <Image
            source={require('../assets/black_customer.png')}
            style={styles.imageIcon}
          />
          <Text style={styles.buttonText}>Customer</Text>
        </TouchableOpacity>

        {/* Vendor Button (already had onPress) */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('SignUpVendor')}>
          <Image
            source={require('../assets/black_vendor.png')}
            style={styles.imageIcon}
          />
          <Text style={styles.buttonText}>Vendor</Text>
        </TouchableOpacity>
      </View>

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
});

