import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PersonGrid from '../components/PersonGrid';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import { createSavedPerson, ApiError } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { people, allNamed } = usePeople();
  const [savingAll, setSavingAll] = useState(false);

  const handleSaveToMyPeople = async () => {
    setSavingAll(true);
    try {
      await Promise.all(
        people
          .filter((p) => p.name.trim())
          .map((p) => createSavedPerson(p.name.trim(), p.imageUri))
      );
      Alert.alert('Saved', 'These people are now in your saved list for next time.');
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof ApiError
          ? err.message
          : 'Check that the API is running and EXPO_PUBLIC_API_URL is set.'
      );
    } finally {
      setSavingAll(false);
    }
  };

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
          title="🎲 Pick Random Person"
          onPress={() => navigation.navigate('RandomPicker')}
          disabled={!allNamed}
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
  footer: {
    paddingVertical: 16,
  },
  spaced: {
    marginTop: 12,
  },
});
