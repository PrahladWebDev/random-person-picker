import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Easing } from 'react-native';
import { useThemeColors } from '../useThemeColors';

type Props = {
  size?: number;
  emoji?: string;
};

// A small one-shot entrance animation for the dice logo on the auth screens:
// fades in, springs up from a smaller scale, and settles out of a slight
// rotation — runs again every time the screen mounts (e.g. navigating from
// Login to Register), rather than only once per app launch.
export default function AnimatedLogo({ size = 72, emoji = '🎲' }: Props) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(0.3);
    rotate.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-28deg', '0deg'] });

  return (
    <Animated.View
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          opacity,
          transform: [{ scale }, { rotate: spin }],
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.44 }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
});
