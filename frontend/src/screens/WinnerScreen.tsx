import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import WinnerCard from '../components/WinnerCard';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Winner'>;

export default function WinnerScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const { people, clearAll } = usePeople();
  const { winner } = route.params;

  // Previously this picked a winner instantly and swapped this screen for
  // itself — no shuffle, the new name just appeared. "Pick Again" should
  // feel the same as the first pick, so send the user back through the
  // RandomPicker screen and let its shuffle animation run again.
  const pickAgain = () => {
    navigation.replace('RandomPicker');
  };

  const startOver = () => {
    clearAll();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <WinnerCard winner={winner} />
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Pick Again" onPress={pickAgain} />
        <PrimaryButton
          title="Edit People"
          variant="secondary"
          onPress={() => navigation.navigate('AddPeople', { count: people.length })}
          style={styles.spaced}
        />
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
  footer: {
    paddingTop: 12,
  },
  spaced: {
    marginTop: 12,
  },
});
