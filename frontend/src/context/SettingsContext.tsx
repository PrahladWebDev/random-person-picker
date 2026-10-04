import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSoundEnabled, setHapticsEnabled } from '../utils/feedback';

const STORAGE_KEY = 'randompick:settings:v1';

type SettingsContextValue = {
  soundOn: boolean;
  hapticsOn: boolean;
  /** When on, people who already won this session are left out of later picks. */
  noRepeats: boolean;
  /** How many winners to pick at once (kept in memory only; clamped at pick time). */
  winnerCount: number;
  setSoundOn: (v: boolean) => void;
  setHapticsOn: (v: boolean) => void;
  setNoRepeats: (v: boolean) => void;
  setWinnerCount: (n: number) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOnState] = useState(true);
  const [hapticsOn, setHapticsOnState] = useState(true);
  const [noRepeats, setNoRepeatsState] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // Load saved toggles once on launch.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (typeof saved.soundOn === 'boolean') setSoundOnState(saved.soundOn);
          if (typeof saved.hapticsOn === 'boolean') setHapticsOnState(saved.hapticsOn);
          if (typeof saved.noRepeats === 'boolean') setNoRepeatsState(saved.noRepeats);
        }
      } catch {
        // Corrupt/unavailable storage — just use defaults.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Keep the module-level flags used by sounds/haptics in sync, and persist.
  useEffect(() => {
    setSoundEnabled(soundOn);
    setHapticsEnabled(hapticsOn);
    if (!loaded) return; // don't overwrite stored values with defaults before loading
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ soundOn, hapticsOn, noRepeats })).catch(
      () => {}
    );
  }, [soundOn, hapticsOn, noRepeats, loaded]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      soundOn,
      hapticsOn,
      noRepeats,
      winnerCount,
      setSoundOn: setSoundOnState,
      setHapticsOn: setHapticsOnState,
      setNoRepeats: setNoRepeatsState,
      setWinnerCount,
    }),
    [soundOn, hapticsOn, noRepeats, winnerCount]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
