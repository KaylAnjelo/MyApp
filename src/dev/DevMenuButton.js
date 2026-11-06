import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { navigationRef } from '../App';
import { Shadows } from '../styles/theme';

export default function DevMenuButton() {
  const [currentRoute, setCurrentRoute] = useState('');

  useEffect(() => {
    const checkRoute = () => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route && route.name !== currentRoute) {
          setCurrentRoute(route.name);
        }
      }
    };

    const interval = setInterval(checkRoute, 150);
    return () => clearInterval(interval);
  }, [currentRoute]);

  if (!__DEV__) return null;
  if (currentRoute === 'DevScreenMenu') return null;

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('DevScreenMenu');
        }
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>Dev Menu</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#7D0006',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    zIndex: 99999,
    elevation: 10,
    ...Shadows.medium,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
