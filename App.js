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
import MyPointsScreen from './customer_screens/MyPointsScreen';
import FoodChasePage from './customer_screens/FoodChaseScreen';
import MyRewardsPage from './customer_screens/MyRewardsScreen';
import ProfilePageScreen from './customer_screens/ProfilePageScreen';
import VendorHomePage from './vendor_screens/VendorHomePage';
import SalesPage from './vendor_screens/SalesPage';
import VendorProfilePage from './vendor_screens/VendorProfilePage';
import TransactionPage from './vendor_screens/TransactionPage';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="Launch" component={LaunchScreen} />
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        <Stack.Screen name="SignUp" component={SignUpUserTypeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="HomePage" component={HomePageScreen} />   
        <Stack.Screen name="SignUpVendor" component={SignUpVendorScreen} />
        <Stack.Screen name="SignUpCustomer" component={SignUpCustomerScreen} />
        <Stack.Screen name="MyPoints" component={MyPointsScreen} />
        <Stack.Screen name="FoodChase" component={FoodChasePage} />
        <Stack.Screen name="MyRewards" component={MyRewardsPage} />
        <Stack.Screen name="ProfilePage" component={ProfilePageScreen} />
        <Stack.Screen name="VendorHomePage" component={VendorHomePage} />
        <Stack.Screen name="SalesPage" component={SalesPage} />
        <Stack.Screen name="VendorProfilePage" component={VendorProfilePage} />
        <Stack.Screen name="TransactionPage" component={TransactionPage} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
