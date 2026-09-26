import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SavedPerson } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import {
  fetchSavedPeople,
  createSavedPerson,
  deleteSavedPerson,
  ApiError,
} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedPeople'>;

export default function SavedPeopleScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { addPeople } = usePeople();

  const [saved, setSaved] = useState<SavedPerson[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const people = await fetchSavedPeople();
      setSaved(people);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : 'Could not reach the server. Check that the API is running and EXPO_PUBLIC_API_URL is set.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pickNewImage = () => {
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Camera', onPress: pickNewImageFromCamera },
      { text: 'Gallery', onPress: pickNewImageFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickNewImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (uri) setNewImageUri(uri);
  };

  const pickNewImageFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (uri) setNewImageUri(uri);
  };

  const handleSaveNew = async () => {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Give this person a name before saving.');
      return;
    }
    setSaving(true);
    try {
      const created = await createSavedPerson(newName.trim(), newImageUri);
      setSaved((prev) => [created, ...prev]);
      setNewName('');
      setNewImageUri(undefined);
    } catch (err) {
      console.error('handleSaveNew failed:', err);
      Alert.alert(
        'Could not save',
        err instanceof ApiError
          ? err.message
          : `Network error — is the backend running and reachable? (${String(err)})`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (person: SavedPerson) => {
    Alert.alert('Remove saved person', `Delete "${person.name}" from your saved list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedPerson(person._id);
            setSaved((prev) => prev.filter((p) => p._id !== person._id));
            setSelected((prev) => {
              const next = { ...prev };
              delete next[person._id];
              return next;
            });
          } catch (err) {
            Alert.alert('Could not delete', err instanceof ApiError ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleUseSelected = () => {
    const chosen = saved.filter((p) => selected[p._id]);
    addPeople(chosen.map((p) => ({ name: p.name, imageUri: p.imageUrl })));
    navigation.navigate('Review');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Saved People</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        Reuse people you've added before — saved to your account, photos included.
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>{loadError}</Text>
          <PrimaryButton title="Retry" variant="secondary" onPress={load} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {saved.length === 0 ? (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              No saved people yet — add one below.
            </Text>
          ) : (
            saved.map((person) => {
              const isSelected = !!selected[person._id];
              return (
                <Pressable
                  key={person._id}
                  onPress={() => toggleSelected(person._id)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  {person.imageUrl ? (
                    <Image source={{ uri: person.imageUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.placeholder }]}>
                      <Text style={{ fontSize: 20 }}>🙂</Text>
                    </View>
                  )}
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {person.name}
                  </Text>
                  <Pressable onPress={() => handleDelete(person)} hitSlop={10}>
                    <Text style={[styles.delete, { color: colors.danger }]}>Delete</Text>
                  </Pressable>
                </Pressable>
              );
            })
          )}

          <View style={[styles.newCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.newLabel, { color: colors.subtext }]}>Add a new saved person</Text>
            <View style={styles.newRow}>
              <Pressable onPress={pickNewImage} style={styles.photoWrap}>
                {newImageUri ? (
                  <Image source={{ uri: newImageUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.placeholder }]}>
                    <Text style={{ fontSize: 20 }}>📷</Text>
                  </View>
                )}
              </Pressable>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter name"
                placeholderTextColor={colors.subtext}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              />
            </View>
            <PrimaryButton
              title={saving ? 'Saving…' : 'Save Person'}
              onPress={handleSaveNew}
              disabled={saving}
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <PrimaryButton title="Back" variant="secondary" onPress={() => navigation.goBack()} style={styles.half} />
        <PrimaryButton
          title={`Use Selected (${selectedCount})`}
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
  scroll: { paddingBottom: 16 },
  center: { alignItems: 'center', marginTop: 24 },
  error: { fontSize: 14, textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
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
  delete: { fontSize: 13, fontWeight: '600' },
  newCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginTop: 8 },
  newLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  newRow: { flexDirection: 'row', alignItems: 'center' },
  photoWrap: { marginRight: 12 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  footer: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  half: { flex: 1 },
});
