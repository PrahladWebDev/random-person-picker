import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from '../types/person';
import { useAuth } from '../context/AuthContext';
import { useThemeColors } from '../useThemeColors';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import NumberOfPeopleScreen from '../screens/NumberOfPeopleScreen';
import AddPeopleScreen from '../screens/AddPeopleScreen';
import ImportContactsScreen from '../screens/ImportContactsScreen';
import ReviewScreen from '../screens/ReviewScreen';
import RandomPickerScreen from '../screens/RandomPickerScreen';
import WinnerScreen from '../screens/WinnerScreen';
import SavedPeopleScreen from '../screens/SavedPeopleScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const scheme = useColorScheme();
  const { isLoading, token, user } = useAuth();
  const colors = useThemeColors();

  if (isLoading) {
    // Waiting on the one AsyncStorage read that says whether a session is
    // already stored, so we don't flash the login screen for a signed-in
    // user on every app launch.
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isAuthenticated = Boolean(token && user);

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="NumberOfPeople" component={NumberOfPeopleScreen} />
            <Stack.Screen name="AddPeople" component={AddPeopleScreen} />
            <Stack.Screen name="ImportContacts" component={ImportContactsScreen} />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="RandomPicker" component={RandomPickerScreen} />
            <Stack.Screen name="Winner" component={WinnerScreen} />
            <Stack.Screen name="SavedPeople" component={SavedPeopleScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
