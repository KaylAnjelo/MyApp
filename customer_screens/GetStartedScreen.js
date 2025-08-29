import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../styles/theme';

export default function GetStartedScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/get_started_icon.png')}
        style={styles.image}
      />
      <Text style={styles.title}>Eat smart. Earn points</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  image: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '65%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: Typography.h3,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 200,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: 40,
    borderRadius: Radii.xl,
    ...Shadows.light,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: Typography.body,
  },
});

