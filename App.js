import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LaunchScreen from './screens/LaunchScreen';
import GetStartedScreen from './screens/GetStartedScreen';
import SignUpUserTypeScreen from './screens/SignUpUserTypeScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpVendorScreen from './screens/SignUpVendorScreen';
import SignUpCustomerScreen from './screens/SignUpCustomerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Launch" component={LaunchScreen} />
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        <Stack.Screen name="SignUp" component={SignUpUserTypeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUpVendor" component={SignUpVendorScreen} />
        <Stack.Screen name="SignUpCustomer" component={SignUpCustomerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
