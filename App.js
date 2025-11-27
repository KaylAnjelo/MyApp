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
import StoresScreen from './customer_screens/StoresScreen';
import SpecificStoreScreen from './customer_screens/SpecificStoreScreen';
import AllProductsScreen from './customer_screens/AllProductsScreen';
import MyPointsScreen from './customer_screens/MyPointsScreen';
import MyRewardsPage from './customer_screens/MyRewardsScreen';
import ProfilePageScreen from './customer_screens/ProfilePageScreen';
import ActivityScreen from './customer_screens/ActivityScreen';
import VendorHomePage from './vendor_screens/VendorHomePage';
import SalesPage from './vendor_screens/SalesPage';
import VendorProfilePage from './vendor_screens/VendorProfilePage';
import TransactionPage from './vendor_screens/TransactionPage';
import ScannerScreen from './customer_screens/ScannerScreen';
import CreateOrderScreen from './vendor_screens/AddMenuPage';
import PointsHistoryScreen from './customer_screens/PointsHistoryScreen';
import TransactionDetailsScreen from './customer_screens/TransactionDetailsScreen';
import ChangePasswordScreen from './customer_screens/ChangePasswordScreen';
import VendorTransactionDetail from './vendor_screens/VendorTransactionDetailScreen';
import NotificationsScreen from './customer_screens/NotificationsScreen';
import ForgotPasswordScreen from './customer_screens/ForgotPasswordScreen';
import VerifyOTPScreen from './customer_screens/VerifyOTPScreen';
import ResetPasswordScreen from './customer_screens/ResetPasswordScreen';
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
        <Stack.Screen name="Stores" component={StoresScreen} />
        <Stack.Screen name="SpecificStore" component={SpecificStoreScreen} />
        <Stack.Screen name="AllProducts" component={AllProductsScreen} />
        <Stack.Screen name="SignUpVendor" component={SignUpVendorScreen} />
        <Stack.Screen name="SignUpCustomer" component={SignUpCustomerScreen} />
        <Stack.Screen name="MyPoints" component={MyPointsScreen} />
        <Stack.Screen name="MyRewards" component={MyRewardsPage} />
        <Stack.Screen name="ProfilePage" component={ProfilePageScreen} />
        <Stack.Screen name="ActivityScreen" component={ActivityScreen} />
        <Stack.Screen name="VendorHomePage" component={VendorHomePage} />
        <Stack.Screen name="SalesPage" component={SalesPage} />
        <Stack.Screen name="VendorProfilePage" component={VendorProfilePage} />
        <Stack.Screen name="TransactionPage" component={TransactionPage} />
        <Stack.Screen name="ScannerScreen" component={ScannerScreen} />
        <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
        <Stack.Screen name="PointsHistory" component={PointsHistoryScreen} />
        <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
        <Stack.Screen name="VTransactionDetail" component={VendorTransactionDetail} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
