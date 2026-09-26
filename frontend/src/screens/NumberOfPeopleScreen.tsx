import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';

type Props = NativeStackScreenProps<RootStackParamList, 'NumberOfPeople'>;

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 50;

export default function NumberOfPeopleScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [value, setValue] = useState('5');
  const [error, setError] = useState<string | null>(null);

  const clamp = (n: number) => Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, n));

  const adjust = (delta: number) => {
    const current = parseInt(value, 10) || MIN_PEOPLE;
    setValue(String(clamp(current + delta)));
    setError(null);
  };

  const handleContinue = () => {
    const count = parseInt(value, 10);
    if (isNaN(count) || count < MIN_PEOPLE || count > MAX_PEOPLE) {
      setError(`Please enter a number between ${MIN_PEOPLE} and ${MAX_PEOPLE}.`);
      return;
    }
    navigation.navigate('AddPeople', { count });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.question, { color: colors.text }]}>
        How many people do you want to add?
      </Text>

      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => adjust(-1)}
          style={[styles.stepperButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.stepperText, { color: colors.text }]}>−</Text>
        </Pressable>

        <TextInput
          value={value}
          onChangeText={(t) => {
            setValue(t.replace(/[^0-9]/g, ''));
            setError(null);
          }}
          keyboardType="number-pad"
          maxLength={2}
          style={[
            styles.input,
            { color: colors.text, borderColor: error ? colors.danger : colors.border },
          ]}
        />

        <Pressable
          onPress={() => adjust(1)}
          style={[styles.stepperButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: colors.subtext }]}>
        Min {MIN_PEOPLE} · Max {MAX_PEOPLE}
      </Text>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <View style={styles.footer}>
        <PrimaryButton title="Back" variant="secondary" onPress={() => navigation.goBack()} style={styles.half} />
        <PrimaryButton title="Continue" onPress={handleContinue} style={styles.half} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 32,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 24,
    fontWeight: '700',
  },
  input: {
    width: 100,
    height: 64,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 13,
  },
  error: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    marginBottom: 24,
  },
  half: {
    flex: 1,
  },
});
