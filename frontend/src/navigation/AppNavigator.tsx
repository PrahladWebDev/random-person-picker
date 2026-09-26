import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { RootStackParamList } from '../types/person';

import HomeScreen from '../screens/HomeScreen';
import NumberOfPeopleScreen from '../screens/NumberOfPeopleScreen';
import AddPeopleScreen from '../screens/AddPeopleScreen';
import ReviewScreen from '../screens/ReviewScreen';
import RandomPickerScreen from '../screens/RandomPickerScreen';
import WinnerScreen from '../screens/WinnerScreen';
import SavedPeopleScreen from '../screens/SavedPeopleScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NumberOfPeople" component={NumberOfPeopleScreen} />
        <Stack.Screen name="AddPeople" component={AddPeopleScreen} />
        <Stack.Screen name="Review" component={ReviewScreen} />
        <Stack.Screen name="RandomPicker" component={RandomPickerScreen} />
        <Stack.Screen name="Winner" component={WinnerScreen} />
        <Stack.Screen name="SavedPeople" component={SavedPeopleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
