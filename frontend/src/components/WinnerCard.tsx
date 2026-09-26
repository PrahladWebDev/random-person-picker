import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Person } from '../types/person';
import { useThemeColors } from '../useThemeColors';

export default function WinnerCard({ winner }: { winner: Person }) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={styles.confetti}>🎉</Text>
      <Text style={[styles.label, { color: colors.subtext }]}>Selected Person</Text>

      {winner.imageUri ? (
        <Image source={{ uri: winner.imageUri }} style={[styles.photo, { borderColor: colors.primary }]} />
      ) : (
        <View
          style={[
            styles.photoPlaceholder,
            { backgroundColor: colors.placeholder, borderColor: colors.primary },
          ]}
        >
          <Text style={{ fontSize: 48 }}>🙂</Text>
        </View>
      )}

      <Text style={[styles.name, { color: colors.text }]}>{winner.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 24,
  },
  confetti: {
    fontSize: 40,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
});
