import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PeopleProvider } from './src/context/PeopleContext';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { releaseSounds } from './src/utils/sounds';

// Keep the native splash (assets/splash-icon.png, configured via the
// expo-splash-screen plugin in app.json) on screen until we explicitly hide
// it below. Without this, Expo SDK 53+ ignores the legacy top-level
// `splash` key in app.json and just shows a blank white screen on launch.
SplashScreen.preventAutoHideAsync().catch(() => {});
// setOptions is synchronous (returns void, not a Promise) — chaining
// .catch() on it throws "Cannot read property 'catch' of undefined".
SplashScreen.setOptions({ duration: 400, fade: true });

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Release the native audio players when the app is torn down.
    return () => releaseSounds();
  }, []);

  const onRootLayout = useCallback(() => {
    if (!isReady) {
      setIsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  return (
    <SafeAreaProvider onLayout={onRootLayout}>
      <AuthProvider>
        <SettingsProvider>
          <PeopleProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </PeopleProvider>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}