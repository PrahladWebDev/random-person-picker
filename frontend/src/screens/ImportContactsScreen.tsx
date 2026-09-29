import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// This SDK's `expo-contacts` root import now points at a new class-based
// API; the function-based methods this screen uses (getContactsAsync,
// requestPermissionsAsync, Fields, SortTypes) still exist, but only under
// the /legacy subpath.
import * as Contacts from 'expo-contacts/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ImportContacts'>;

type ContactRow = {
  id: string;
  name: string;
  imageUri?: string;
};

// Contacts can have multiple phone numbers/emails but we only need a name +
// photo, so collapse the raw expo-contacts shape down to this immediately.
function toContactRow(c: Contacts.Contact): ContactRow | null {
  const name = c.name?.trim();
  if (!name) return null; // Skip entries with no usable display name.
  return { id: c.id ?? name, name, imageUri: c.image?.uri };
}

type PermissionState = 'checking' | 'granted' | 'denied';

export default function ImportContactsScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { addPeople } = usePeople();

  const [permission, setPermission] = useState<PermissionState>('checking');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.Image],
        sort: Contacts.SortTypes.FirstName,
      });

      const rows = data
        .map(toContactRow)
        .filter((row): row is ContactRow => row !== null);

      // Contacts can list the same person more than once (multiple entries
      // syncing from different accounts) — collapse by name so the list
      // isn't cluttered with obvious duplicates.
      const seen = new Set<string>();
      const deduped = rows.filter((row) => {
        const key = row.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setContacts(deduped);
    } catch {
      setPermission('denied');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, query]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleUseSelected = async () => {
    const chosen = contacts.filter((c) => selected[c.id]);

    // Contact photos come back as content:// (Android) / ph:// (iOS) URIs
    // owned by the Contacts provider, not real files in our app's storage.
    // Those display fine in <Image> but can't be streamed into a multipart
    // upload the way a file:// URI from the camera/gallery can, which is
    // why saving a contact's photo was silently failing. Copy each photo
    // into our own cache first so it becomes a normal file:// URI.
    const withLocalPhotos = await Promise.all(
      chosen.map(async (c) => {
        if (!c.imageUri) return { name: c.name, imageUri: undefined };
        try {
          const dest = `${FileSystem.cacheDirectory}${c.id}.jpg`;
          await FileSystem.copyAsync({ from: c.imageUri, to: dest });
          return { name: c.name, imageUri: dest };
        } catch (e) {
          // Couldn't copy the contact photo — fall back to no photo rather
          // than failing the whole import.
          console.warn('Could not copy contact photo', c.id, e);
          return { name: c.name, imageUri: undefined };
        }
      })
    );

    addPeople(withLocalPhotos);
    navigation.navigate('Review');
  };

  const renderItem = ({ item }: { item: ContactRow }) => {
    const isSelected = !!selected[item.id];
    return (
      <Pressable
        onPress={() => toggleSelected(item.id)}
        style={[
          styles.row,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.placeholder }]}>
            <Text style={{ fontSize: 20 }}>🙂</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: isSelected ? colors.primary : 'transparent',
            },
          ]}
        >
          {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Import Contacts</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        Pick people straight from your phone's contact list.
      </Text>

      {permission === 'checking' || loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : permission === 'denied' ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>
            Contacts access was denied, so there's nothing to import from.{'\n'}
            Allow access in your device settings to use this.
          </Text>
          <PrimaryButton
            title="Open Settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
            style={{ marginTop: 12 }}
          />
        </View>
      ) : (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search contacts"
            placeholderTextColor={colors.subtext}
            style={[styles.search, { color: colors.text, borderColor: colors.border }]}
            autoCorrect={false}
          />

          {filtered.length === 0 ? (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              {contacts.length === 0
                ? 'No contacts with a name were found.'
                : 'No contacts match your search.'}
            </Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.scroll}
              // Contact lists can run into the thousands — keep it a plain
              // FlatList (no eager ScrollView.map) so scrolling stays smooth.
              initialNumToRender={20}
              windowSize={7}
              keyboardShouldPersistTaps="handled"
              // Android's contacts picker doesn't show avatar thumbnails
              // without an extra permission dance, so keep the emoji
              // placeholder there rather than requesting more than needed.
              removeClippedSubviews={Platform.OS === 'android'}
            />
          )}
        </>
      )}

      <View style={styles.footer}>
        <PrimaryButton title="Back" variant="secondary" onPress={() => navigation.goBack()} style={styles.half} />
        <PrimaryButton
          title={`Add Selected (${selectedCount})`}
          onPress={handleUseSelected}
          disabled={selectedCount === 0}
          style={styles.half}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  center: { alignItems: 'center', marginTop: 24 },
  error: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  search: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  scroll: { paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: { flex: 1, fontSize: 16, fontWeight: '600' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  half: { flex: 1 },
});