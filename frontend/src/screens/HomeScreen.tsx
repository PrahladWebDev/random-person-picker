import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { clearAll } = usePeople();
  const { user, logout } = useAuth();

  const handleStart = () => {
    clearAll();
    navigation.navigate('NumberOfPeople');
  };

  const handleUseSaved = () => {
    clearAll();
    navigation.navigate('SavedPeople');
  };

  const handleImportContacts = () => {
    clearAll();
    navigation.navigate('ImportContacts');
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        {user ? (
          <Text style={[styles.email, { color: colors.subtext }]} numberOfLines={1}>
            {user.email}
          </Text>
        ) : (
          <View />
        )}
        <Pressable onPress={handleSignOut}>
          <Text style={[styles.signOut, { color: colors.primary }]}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoEmoji}>🎲</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>RandomPick</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Random Person Picker</Text>
      </View>

      <View style={styles.startButton}>
        <PrimaryButton title="Start" onPress={handleStart} />
        <PrimaryButton
          title="Use Saved People"
          variant="secondary"
          onPress={handleUseSaved}
          style={styles.spaced}
        />
        <PrimaryButton
          title="Import from Contacts"
          variant="secondary"
          onPress={handleImportContacts}
          style={styles.spaced}
        />
        <PrimaryButton
          title="Winner History"
          variant="secondary"
          onPress={() => navigation.navigate('History')}
          style={styles.spaced}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  email: {
    fontSize: 13,
    flexShrink: 1,
    marginRight: 12,
  },
  signOut: {
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 6,
  },
  startButton: {
    width: '100%',
  },
  spaced: {
    marginTop: 12,
  },
});

