import React, { useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import { pickRandomPerson } from '../utils/randomPicker';
import { playTickSound, playWinSound } from '../utils/sounds';

type Props = NativeStackScreenProps<RootStackParamList, 'RandomPicker'>;

// Deceleration curve: the spin starts fast and each subsequent tick takes a
// little longer than the last, like a real wheel slowing down — rather than
// the old constant-speed cycling, which felt mechanical and just "stopped".
const START_STEP_MS = 65;
const STEP_GROWTH = 1.14; // each tick is ~14% slower than the previous one
const MIN_TICKS = 18; // guarantees a satisfying spin even with only 2-3 people
const SETTLE_HOLD_MS = 850; // how long we linger on the winner before navigating

export default function RandomPickerScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { people } = usePeople();
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  function tickPulse() {
    // A quick, punchy scale-down/up on every name change — the "flicker" of a
    // spinning slot rather than a smooth idle pulse.
    scale.setValue(0.94);
    Animated.timing(scale, {
      toValue: 1,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  function crossFadeTo(nextIndex: number) {
    Animated.timing(cardOpacity, { toValue: 0, duration: 55, useNativeDriver: true }).start(() => {
      setDisplayIndex(nextIndex);
      Animated.timing(cardOpacity, { toValue: 1, duration: 55, useNativeDriver: true }).start();
    });
  }

  function landOnWinner(winnerIndex: number) {
    setDisplayIndex(winnerIndex);
    setHasLanded(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playWinSound();

    glow.setValue(0);
    scale.setValue(1);
    cardOpacity.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.18, friction: 3.2, tension: 140, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]),
      Animated.timing(glow, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      const winner = people[winnerIndex];
      setIsShuffling(false);
      navigation.replace('Winner', { winner });
    }, SETTLE_HOLD_MS);
  }

  function handlePick() {
    if (people.length === 0 || isShuffling) return;
    setIsShuffling(true);
    setHasLanded(false);
    glow.setValue(0);

    const winnerIndex = people.indexOf(pickRandomPerson(people));
    const tickCount = Math.max(MIN_TICKS, people.length * 4);

    let step = 0;
    let delay = START_STEP_MS;
    let cursor = displayIndex;

    function scheduleNext() {
      setTimeout(() => {
        step += 1;
        const isLastTick = step >= tickCount;

        if (isLastTick) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          landOnWinner(winnerIndex);
          return;
        }

        // On the final few ticks, bias the walk toward the winner so the
        // spin feels like it's "honing in" rather than jumping randomly
        // right up until the last frame.
        const remaining = tickCount - step;
        if (remaining <= 3) {
          cursor = winnerIndex;
        } else {
          cursor = (cursor + 1 + Math.floor(Math.random() * 2)) % people.length;
        }

        crossFadeTo(cursor);
        tickPulse();
        playTickSound();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        delay = Math.min(delay * STEP_GROWTH, 420);
        scheduleNext();
      }, delay);
    }

    scheduleNext();
  }

  const current = people[displayIndex];

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {isShuffling && !hasLanded ? 'Picking…' : hasLanded ? '🎉 Got it!' : 'Ready to pick!'}
      </Text>

      <View style={styles.stage}>
        <View style={styles.photoWrap}>
          <Animated.View
            style={[
              styles.glowRing,
              { backgroundColor: colors.primary, opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <Animated.View style={{ opacity: cardOpacity, transform: [{ scale }] }}>
            {current?.imageUri ? (
              <Image source={{ uri: current.imageUri }} style={[styles.photo, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.placeholder, borderColor: colors.primary }]}>
                <Text style={{ fontSize: 40 }}>🙂</Text>
              </View>
            )}
          </Animated.View>
        </View>
        <Animated.Text style={[styles.name, { color: colors.text, opacity: cardOpacity }]}>
          {current?.name ?? ''}
        </Animated.Text>
      </View>

      <PrimaryButton
        title={isShuffling ? (hasLanded ? '🎉 Picked!' : 'Shuffling…') : '🎲 PICK RANDOM PERSON'}
        onPress={handlePick}
        disabled={isShuffling || people.length === 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  photoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  photo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
  },
  photoPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
  },
});
