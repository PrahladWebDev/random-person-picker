import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PersonGrid from '../components/PersonGrid';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import { useSettings } from '../context/SettingsContext';
import { createSavedPerson, ApiError } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { people, allNamed, updatePerson, pastWinnerIds, resetWinners } = usePeople();
  const {
    soundOn,
    hapticsOn,
    noRepeats,
    winnerCount,
    setSoundOn,
    setHapticsOn,
    setNoRepeats,
    setWinnerCount,
  } = useSettings();
  const [savingAll, setSavingAll] = useState(false);

  // Picking everyone as a "winner" is pointless, so leave at least one person out.
  const maxWinners = Math.max(1, people.length - 1);
  const winners = Math.min(winnerCount, maxWinners);

  const alreadyWon = people.filter((p) => pastWinnerIds.includes(p.id)).length;
  const poolSize = noRepeats ? people.length - alreadyWon : people.length;
  const chance = `${Math.min(winners, Math.max(poolSize, 1))} in ${Math.max(poolSize, 1)}`;

  const handleSaveToMyPeople = async () => {
    setSavingAll(true);
    try {
      // Skip anyone already in the saved list so we don't create duplicates.
      const toSave = people.filter((p) => p.name.trim() && !p.savedId);
      const results = await Promise.allSettled(
        toSave.map((p) => createSavedPerson(p.name.trim(), p.imageUri))
      );

      // Remember which ones saved, so pressing the button again can't duplicate them.
      let failed = 0;
      let firstError: unknown = null;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          updatePerson(toSave[i].id, { savedId: r.value._id });
        } else {
          failed += 1;
          if (!firstError) firstError = r.reason;
        }
      });

      if (failed > 0) {
        Alert.alert(
          'Some could not be saved',
          `${failed} of ${toSave.length} failed. ` +
            (firstError instanceof ApiError
              ? firstError.message
              : 'Check that the API is running and EXPO_PUBLIC_API_URL is set.') +
            ' Press the button again to retry just those.'
        );
      } else {
        Alert.alert(
          'Saved',
          toSave.length === 0
            ? 'Everyone here is already in your saved list.'
            : 'These people are now in your saved list for next time.'
        );
      }
    } finally {
      setSavingAll(false);
    }
  };

  const canPick = allNamed && poolSize >= 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Review People</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        {people.length} {people.length === 1 ? 'person' : 'people'} added
      </Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <PersonGrid
          people={people}
          onEdit={() => navigation.navigate('AddPeople', { count: people.length })}
        />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.subtext }]}>Options</Text>

          <View style={styles.optionRow}>
            <Text style={[styles.optionText, { color: colors.text }]}>Winners to pick</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setWinnerCount(Math.max(1, winners - 1))}
                disabled={winners <= 1}
                style={[styles.stepBtn, { borderColor: colors.border, opacity: winners <= 1 ? 0.4 : 1 }]}
                accessibilityLabel="Fewer winners"
              >
                <Text style={[styles.stepText, { color: colors.text }]}>−</Text>
              </Pressable>
              <Text style={[styles.stepValue, { color: colors.text }]}>{winners}</Text>
              <Pressable
                onPress={() => setWinnerCount(Math.min(maxWinners, winners + 1))}
                disabled={winners >= maxWinners}
                style={[
                  styles.stepBtn,
                  { borderColor: colors.border, opacity: winners >= maxWinners ? 0.4 : 1 },
                ]}
                accessibilityLabel="More winners"
              >
                <Text style={[styles.stepText, { color: colors.text }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionTextWrap}>
              <Text style={[styles.optionText, { color: colors.text }]}>No repeat winners</Text>
              <Text style={[styles.optionHint, { color: colors.subtext }]}>
                People who already won are skipped next time.
              </Text>
            </View>
            <Switch
              value={noRepeats}
              onValueChange={setNoRepeats}
              trackColor={{ true: colors.primary }}
            />
          </View>

          {noRepeats && alreadyWon > 0 && (
            <View style={styles.optionRow}>
              <Text style={[styles.optionHint, { color: colors.subtext }]}>
                {alreadyWon} already won this session.
              </Text>
              <Pressable onPress={resetWinners} hitSlop={8}>
                <Text style={[styles.link, { color: colors.primary }]}>Reset</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.optionRow}>
            <Text style={[styles.optionText, { color: colors.text }]}>Sound</Text>
            <Switch value={soundOn} onValueChange={setSoundOn} trackColor={{ true: colors.primary }} />
          </View>

          <View style={styles.optionRow}>
            <Text style={[styles.optionText, { color: colors.text }]}>Haptics</Text>
            <Switch
              value={hapticsOn}
              onValueChange={setHapticsOn}
              trackColor={{ true: colors.primary }}
            />
          </View>

          <Text style={[styles.fairness, { color: colors.subtext }]}>
            ⚖️ Fair pick: every eligible person has the same chance ({chance} each), chosen at random on
            your device.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Add / Edit People"
          variant="secondary"
          onPress={() => navigation.navigate('AddPeople', { count: people.length })}
        />
        <PrimaryButton
          title={savingAll ? 'Saving…' : 'Save to My People'}
          variant="secondary"
          onPress={handleSaveToMyPeople}
          disabled={savingAll || people.length === 0}
          style={styles.spaced}
        />
        <PrimaryButton
          title={winners > 1 ? `🎲 Pick ${winners} Random People` : '🎲 Pick Random Person'}
          onPress={() => navigation.navigate('RandomPicker')}
          disabled={!canPick}
          style={styles.spaced}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  scroll: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionTextWrap: { flex: 1, paddingRight: 12 },
  optionText: { fontSize: 16, fontWeight: '600' },
  optionHint: { fontSize: 12, marginTop: 2 },
  link: { fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, fontWeight: '700', lineHeight: 22 },
  stepValue: { fontSize: 18, fontWeight: '800', minWidth: 36, textAlign: 'center' },
  fairness: { fontSize: 12, marginTop: 10, lineHeight: 17 },
  footer: {
    paddingVertical: 16,
  },
  spaced: {
    marginTop: 12,
  },
});
