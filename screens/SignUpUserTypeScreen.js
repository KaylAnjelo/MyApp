import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function SignUpUserTypeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Please select your user type.</Text>

        <TouchableOpacity style={styles.button}>
          <Image
            source={require('../assets/black_customer.png')}
            style={styles.imageIcon}
          />
          <Text style={styles.buttonText}>Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}
            onPress={() => navigation.navigate('SignUpVendor')}>
          <Image
            source={require('../assets/black_vendor.png')}
            style={styles.imageIcon}
          />
          <Text style={styles.buttonText}>Vendor</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Already have an account? <Text style={styles.signIn}>Sign in here</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  topSection: {
    backgroundColor: '#7D0006',
    paddingTop: 60,
    paddingHorizontal: 25,
    paddingBottom: 100,
    borderBottomLeftRadius: 60,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  imageIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: 'contain',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    color: '#7D0006',
    fontSize: 13,
    marginBottom: 200,
  },
  signIn: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
