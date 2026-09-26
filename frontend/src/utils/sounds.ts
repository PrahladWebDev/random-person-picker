import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

const tickSource = require('../../assets/sounds/tick.wav');
const winSource = require('../../assets/sounds/win.wav');

let tickPlayer: AudioPlayer | null = null;
let winPlayer: AudioPlayer | null = null;
let ready = false;

/**
 * Creates the two players once and puts the app in "play even in silent
 * mode" audio mode. Safe to call multiple times — later calls are no-ops.
 */
async function ensureReady() {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
  } catch {
    // Non-fatal — playback still works without silent-mode override.
  }
  tickPlayer = createAudioPlayer(tickSource);
  winPlayer = createAudioPlayer(winSource);
}

/** Plays the short spin "tick" — called on every step of the shuffle. */
export async function playTickSound() {
  await ensureReady();
  if (!tickPlayer) return;
  try {
    tickPlayer.seekTo(0);
    tickPlayer.play();
  } catch {
    // Ignore playback errors (e.g. device audio unavailable).
  }
}

/** Plays the cheerful chime when a winner is landed on. */
export async function playWinSound() {
  await ensureReady();
  if (!winPlayer) return;
  try {
    winPlayer.seekTo(0);
    winPlayer.play();
  } catch {
    // Ignore playback errors.
  }
}

/** Releases both native players — call from the root component on unmount. */
export function releaseSounds() {
  tickPlayer?.release();
  winPlayer?.release();
  tickPlayer = null;
  winPlayer = null;
  ready = false;
}
