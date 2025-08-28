import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LaunchScreen from './customer_screens/LaunchScreen';
import GetStartedScreen from './customer_screens/GetStartedScreen';
import SignUpUserTypeScreen from './customer_screens/SignUpUserTypeScreen';
import SignInScreen from './customer_screens/SignInScreen';
import SignUpVendorScreen from './customer_screens/SignUpVendorScreen';
import SignUpCustomerScreen from './customer_screens/SignUpCustomerScreen';
import HomePageScreen from './customer_screens/HomePageScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Launch" component={LaunchScreen} />
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        <Stack.Screen name="SignUp" component={SignUpUserTypeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="HomePage" component={HomePageScreen} />   
        <Stack.Screen name="SignUpVendor" component={SignUpVendorScreen} />
        <Stack.Screen name="SignUpCustomer" component={SignUpCustomerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
