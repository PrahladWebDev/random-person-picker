import React, { useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Share, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import WinnerCard from '../components/WinnerCard';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import { useSettings } from '../context/SettingsContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Winner'>;

export default function WinnerScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const { people, clearAll, pastWinnerIds, resetWinners } = usePeople();
  const { noRepeats } = useSettings();
  const { winners, poolSize } = route.params;

  const isMulti = winners.length > 1;

  // The card that gets turned into a picture when sharing.
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  // With "no repeats" on, a pick-again is only possible while someone hasn't won yet.
  const remaining = people.filter((p) => !pastWinnerIds.includes(p.id)).length;
  const outOfPeople = noRepeats && remaining === 0;

  // Previously this picked a winner instantly and swapped this screen for
  // itself — no shuffle, the new name just appeared. "Pick Again" should
  // feel the same as the first pick, so send the user back through the
  // RandomPicker screen and let its shuffle animation run again.
  const pickAgain = () => {
    if (outOfPeople) resetWinners();
    navigation.replace('RandomPicker');
  };

  const startOver = () => {
    clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const chanceText = `${winners.length} in ${poolSize}`;

  const shareAsText = async () => {
    const names = isMulti
      ? `🎉 Winners:\n${winners.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}`
      : `🎉 Winner: ${winners[0].name}`;
    const message = `${names}\n\nPicked at random from ${poolSize} people (${chanceText} chance each) with RandomPick.`;
    try {
      await Share.share({ message });
    } catch {
      // The user dismissed the share sheet or sharing isn't available — nothing to do.
    }
  };

  // Shares the winner card as a PNG picture. If capturing or the system share
  // sheet isn't available for any reason, fall back to sharing plain text so
  // the button always does something useful.
  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const canShareFile = await Sharing.isAvailableAsync();
      if (!canShareFile || !shareCardRef.current) {
        await shareAsText();
        return;
      }
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: isMulti ? 'Share the winners' : 'Share the winner',
      });
    } catch (err) {
      console.warn('Image share failed, falling back to text:', err);
      Alert.alert('Could not share the picture', 'Sharing the result as text instead.', [
        { text: 'OK', onPress: () => shareAsText() },
      ]);
    } finally {
      setSharing(false);
    }
  };

  // The card that gets turned into a picture when sharing. For many winners it
  // sits inside a ScrollView (outside the captured view), so the picture always
  // contains everyone rather than just what fits on screen.
  // collapsable={false} keeps Android from optimising this view away, which
  // would make the capture come out blank. The solid background stops the PNG
  // from being transparent.
  const shareCard = (
    <View
      ref={shareCardRef}
      collapsable={false}
      style={[styles.shareCard, { backgroundColor: colors.background }]}
    >
      {isMulti ? (
        <View style={styles.list}>
          <Text style={styles.confetti}>🎉</Text>
          <Text style={[styles.label, { color: colors.subtext }]}>{winners.length} Selected People</Text>
          {winners.map((w, i) => (
            <View
              key={w.id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.rank, { color: colors.primary }]}>{i + 1}</Text>
              {w.imageUri ? (
                <Image source={{ uri: w.imageUri }} style={[styles.avatar, { borderColor: colors.primary }]} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.placeholder, borderColor: colors.primary },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>🙂</Text>
                </View>
              )}
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {w.name}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <WinnerCard winner={winners[0]} />
      )}
      <Text style={[styles.fairness, { color: colors.subtext }]}>
        ⚖️ Picked at random from {poolSize} {poolSize === 1 ? 'person' : 'people'} — each had an equal
        chance ({chanceText}).
      </Text>
      <Text style={[styles.brand, { color: colors.subtext }]}>🎲 RandomPick</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {isMulti ? <ScrollView contentContainerStyle={styles.scrollContent}>{shareCard}</ScrollView> : shareCard}
      </View>

      <View style={styles.footer}>
        <PrimaryButton title={outOfPeople ? 'Reset & Pick Again' : 'Pick Again'} onPress={pickAgain} />
        <View style={[styles.splitRow, styles.spaced]}>
          <PrimaryButton
            title={sharing ? 'Preparing…' : 'Share'}
            variant="secondary"
            onPress={handleShare}
            disabled={sharing}
            style={styles.half}
          />
          <PrimaryButton
            title="Edit People"
            variant="secondary"
            onPress={() => navigation.navigate('AddPeople', { count: people.length })}
            style={styles.half}
          />
        </View>
        <PrimaryButton title="Start Over" variant="danger" onPress={startOver} style={styles.spaced} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  shareCard: { paddingVertical: 12 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  brand: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  list: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  confetti: { fontSize: 40, textAlign: 'center', marginBottom: 4 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  rank: { width: 28, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, marginHorizontal: 10 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 18, fontWeight: '700' },
  fairness: { fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 17 },
  footer: {
    paddingTop: 12,
  },
  splitRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  spaced: {
    marginTop: 12,
  },
});
