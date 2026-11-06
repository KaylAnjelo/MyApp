import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LaunchScreen from './features/customer/screens/LaunchScreen';
import GetStartedScreen from './features/customer/screens/GetStartedScreen';
import SignUpUserTypeScreen from './features/customer/screens/SignUpUserTypeScreen';
import SignInScreen from './features/customer/screens/SignInScreen';
import SignUpVendorScreen from './features/customer/screens/SignUpVendorScreen';
import SignUpCustomerScreen from './features/customer/screens/SignUpCustomerScreen';
import HomePageScreen from './features/customer/screens/HomePageScreen';
import StoresScreen from './features/customer/screens/StoresScreen';
import SpecificStoreScreen from './features/customer/screens/SpecificStoreScreen';
import AllProductsScreen from './features/customer/screens/AllProductsScreen';
import MyPointsScreen from './features/customer/screens/MyPointsScreen';
import MyRewardsPage from './features/customer/screens/MyRewardsScreen';
import ProfilePageScreen from './features/customer/screens/ProfilePageScreen';
import ActivityScreen from './features/customer/screens/ActivityScreen';
import VendorHomePage from './features/vendor/screens/VendorHomePage';
import SalesPage from './features/vendor/screens/SalesPage';
import VendorProfilePage from './features/vendor/screens/VendorProfilePage';
import TransactionPage from './features/vendor/screens/TransactionPage';
import ScannerScreen from './features/customer/screens/ScannerScreen';
import CreateOrderScreen from './features/vendor/screens/AddMenuPage';
import PointsHistoryScreen from './features/customer/screens/PointsHistoryScreen';
import TransactionDetailsScreen from './features/customer/screens/TransactionDetailsScreen';
import ChangePasswordScreen from './features/customer/screens/ChangePasswordScreen';
import VendorTransactionDetail from './features/vendor/screens/VendorTransactionDetailScreen';
import NotificationsScreen from './features/customer/screens/NotificationsScreen';
import ForgotPasswordScreen from './features/customer/screens/ForgotPasswordScreen';
import VerifyOTPScreen from './features/customer/screens/VerifyOTPScreen';
import ResetPasswordScreen from './features/customer/screens/ResetPasswordScreen';
import DevMenuButton from './dev/DevMenuButton';

// Import DevScreenMenu only in development
const DevScreenMenu = __DEV__ ? require('./dev/DevScreenMenu').default : null;

export const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator();

export default function App() {
  const initialRoute = __DEV__ ? 'DevScreenMenu' : 'Launch';

  useEffect(() => {
    if (__DEV__) {
      AsyncStorage.getItem('@app_user').then((user) => {
        if (!user) {
          AsyncStorage.setItem('@app_user', JSON.stringify({
            user_id: 'dev-customer-id',
            username: 'testcustomer',
            role: 'customer',
            email: 'customer@test.com',
            first_name: 'Test',
            last_name: 'Customer',
          }));
        }
      });
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, animation: 'none' }}>
          {__DEV__ && <Stack.Screen name="DevScreenMenu" component={DevScreenMenu} />}
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
      <DevMenuButton />
    </View>
  );
}
