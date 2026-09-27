import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PeopleProvider } from './src/context/PeopleContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { releaseSounds } from './src/utils/sounds';

export default function App() {
  useEffect(() => {
    // Release the native audio players when the app is torn down.
    return () => releaseSounds();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PeopleProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </PeopleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
