/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({children}: {children: React.ReactNode}) => <>{children}</>,
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const MockNavigator = ({children}: {children: React.ReactNode}) => <>{children}</>;
  const MockScreen = () => null;

  return {
    createNativeStackNavigator: () => ({
      Navigator: MockNavigator,
      Screen: MockScreen,
    }),
  };
});

jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-camera-kit', () => ({
  Camera: 'Camera',
  CameraType: { back: 'back' },
}));
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('react-native-chart-kit', () => ({
  PieChart: () => null,
  LineChart: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => null),
  removeItem: jest.fn(async () => null),
  clear: jest.fn(async () => null),
}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({children}: {children: React.ReactNode}) => <>{children}</>,
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
