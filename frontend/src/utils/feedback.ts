import * as Haptics from 'expo-haptics';

// Module-level switches, kept in sync with the user's saved settings by
// SettingsContext. Plain flags (not React state) so non-component code like
// sounds.ts and the picker's timers can read the latest value instantly.
let soundEnabled = true;
let hapticsEnabled = true;

export function setSoundEnabled(on: boolean) {
  soundEnabled = on;
}
export function setHapticsEnabled(on: boolean) {
  hapticsEnabled = on;
}
export function isSoundEnabled() {
  return soundEnabled;
}

export function hapticSuccess() {
  if (!hapticsEnabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function hapticLight() {
  if (!hapticsEnabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
