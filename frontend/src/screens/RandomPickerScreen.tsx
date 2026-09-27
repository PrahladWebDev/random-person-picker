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
const MIN_TICKS = 22; // guarantees a satisfying spin even with only 2-3 people
const SETTLE_HOLD_MS = 850; // how long we linger on the winner before navigating

export default function RandomPickerScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { people } = usePeople();
  const [isShuffling, setIsShuffling] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);
  const [isTeasing, setIsTeasing] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  function tickPop() {
    // Every name change pops on a spring instead of a flat timing curve —
    // a springy little "boing" so the shuffle feels bouncy and alive rather
    // than mechanically cycling through cards.
    scale.setValue(0.86);
    bounceY.setValue(10);
    wobble.setValue(Math.random() > 0.5 ? -1 : 1);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 220, useNativeDriver: true }),
      Animated.spring(bounceY, { toValue: 0, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.spring(wobble, { toValue: 0, friction: 3, tension: 90, useNativeDriver: true }),
    ]).start();
  }

  function crossFadeTo(nextIndex: number) {
    Animated.timing(cardOpacity, { toValue: 0, duration: 55, useNativeDriver: true }).start(() => {
      setDisplayIndex(nextIndex);
      Animated.timing(cardOpacity, { toValue: 1, duration: 55, useNativeDriver: true }).start();
    });
  }

  function landOnWinner(winnerIndex: number) {
    setDisplayIndex(winnerIndex);
    setIsTeasing(false);
    setHasLanded(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    playWinSound();

    glow.setValue(0);
    scale.setValue(0.7);
    bounceY.setValue(0);
    wobble.setValue(0);
    cardOpacity.setValue(1);

    Animated.parallel([
      // A bouncier, more exaggerated spring settle for the real reveal —
      // it overshoots twice before resting, so the winner feels "won"
      // rather than just landed on.
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.28, friction: 3, tension: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 0.94, friction: 3.5, tension: 160, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
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
    setIsTeasing(false);
    glow.setValue(0);

    const winnerIndex = people.indexOf(pickRandomPerson(people));
    const tickCount = Math.max(MIN_TICKS, people.length * 4);

    // Pick a decoy to hover on for the last couple of ticks — someone who
    // isn't the winner — so the spin genuinely looks like it might land on
    // them before flipping to the real pick. Skipped when there's only one
    // person, since there's no one else to tease.
    const decoyIndex =
      people.length > 1
        ? (winnerIndex + 1 + Math.floor(Math.random() * (people.length - 1))) % people.length
        : winnerIndex;

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

        const remaining = tickCount - step;
        if (remaining <= 2 && people.length > 1) {
          // Hold on the decoy right before the reveal — this is the "almost
          // chose someone else" beat that makes the real pick feel earned
          // instead of obvious from the moment the spin starts slowing down.
          cursor = decoyIndex;
          setIsTeasing(true);
        } else {
          cursor = (cursor + 1 + Math.floor(Math.random() * 2)) % people.length;
        }

        crossFadeTo(cursor);
        tickPop();
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
  const wobbleRotate = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] });

  let statusText = 'Ready to pick!';
  if (isShuffling && !hasLanded) statusText = isTeasing ? 'Almost…' : 'Picking…';
  if (hasLanded) statusText = '🎉 Got it!';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{statusText}</Text>

      <View style={styles.stage}>
        <View style={styles.photoWrap}>
          <Animated.View
            style={[
              styles.glowRing,
              { backgroundColor: colors.primary, opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: bounceY }, { rotate: wobbleRotate }, { scale }],
            }}
          >
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