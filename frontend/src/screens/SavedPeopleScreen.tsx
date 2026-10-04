import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SavedPerson, SavedGroup } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';
import {
  fetchSavedPeople,
  createSavedPerson,
  updateSavedPerson,
  deleteSavedPerson,
  fetchGroups,
  createGroup,
  deleteGroup,
  ApiError,
} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedPeople'>;

type LoadMode = 'initial' | 'silent' | 'refresh';

type EditState = { id: string; name: string; imageUri?: string };

// Opens camera/gallery for a square photo and hands back the local URI.
function choosePhoto(onPicked: (uri: string) => void) {
  const fromCamera = async () => {
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
    if (uri) onPicked(uri);
  };

  const fromGallery = async () => {
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
    if (uri) onPicked(uri);
  };

  Alert.alert('Add photo', 'Choose a source', [
    { text: 'Camera', onPress: fromCamera },
    { text: 'Gallery', onPress: fromGallery },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export default function SavedPeopleScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const { replacePeople } = usePeople();

  const [saved, setSaved] = useState<SavedPerson[]>([]);
  const [groups, setGroups] = useState<SavedGroup[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [newName, setNewName] = useState('');
  const [newImageUri, setNewImageUri] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<EditState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);

  const hasLoaded = useRef(false);

  const load = useCallback(async (mode: LoadMode = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
      setLoadError(null);
    } else if (mode === 'refresh') {
      setRefreshing(true);
    }
    try {
      const [people, grps] = await Promise.all([fetchSavedPeople(), fetchGroups()]);
      setSaved(people);
      setGroups(grps);
      setLoadError(null);
      // Forget selections for people who no longer exist (deleted elsewhere).
      const ids = new Set(people.map((p) => p._id));
      setSelected((prev) => {
        const next: Record<string, boolean> = {};
        for (const id of Object.keys(prev)) if (prev[id] && ids.has(id)) next[id] = true;
        return next;
      });
      hasLoaded.current = true;
    } catch (err) {
      // A silent background refresh that fails just keeps the list we have.
      if (mode !== 'silent') {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : 'Could not reach the server. Check that the API is running and EXPO_PUBLIC_API_URL is set.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  // Coming back to this screen (e.g. after "Save to My People" on Review)
  // quietly reloads so newly saved people show up without a manual refresh.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (hasLoaded.current) load('silent');
    });
    return unsubscribe;
  }, [navigation, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return saved;
    return saved.filter((p) => p.name.toLowerCase().includes(q));
  }, [saved, query]);

  const selectedIds = useMemo(
    () => saved.filter((p) => selected[p._id]).map((p) => p._id),
    [saved, selected]
  );
  const selectedCount = selectedIds.length;

  const toggleSelected = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Select all selects what's currently visible, so it works with the search box.
  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = { ...prev };
      filtered.forEach((p) => {
        next[p._id] = true;
      });
      return next;
    });
  };

  const clearSelection = () => setSelected({});

  // ---------------------------------------------------------------- groups --

  const isGroupActive = (g: SavedGroup) => {
    const members = g.memberIds.filter((id) => saved.some((p) => p._id === id));
    return (
      members.length > 0 &&
      members.length === selectedCount &&
      members.every((id) => selected[id])
    );
  };

  const applyGroup = (g: SavedGroup) => {
    const next: Record<string, boolean> = {};
    g.memberIds.forEach((id) => {
      if (saved.some((p) => p._id === id)) next[id] = true;
    });
    setSelected(next);
  };

  const handleSaveGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      Alert.alert('Name required', 'Give the group a name, like "Family" or "Office team".');
      return;
    }
    setSavingGroup(true);
    try {
      const created = await createGroup(name, selectedIds);
      setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setGroupName('');
    } catch (err) {
      Alert.alert('Could not save group', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = (g: SavedGroup) => {
    Alert.alert('Delete group', `Delete the group "${g.name}"? The people in it stay saved.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(g._id);
            setGroups((prev) => prev.filter((x) => x._id !== g._id));
          } catch (err) {
            Alert.alert('Could not delete', err instanceof ApiError ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  // ------------------------------------------------------------ add / edit --

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

  const startEdit = (person: SavedPerson) => {
    setEditing({ id: person._id, name: person.name });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const original = saved.find((p) => p._id === editing.id);
    const name = editing.name.trim();
    if (!name) {
      Alert.alert('Name required', 'A saved person needs a name.');
      return;
    }
    const nameChanged = !!original && name !== original.name;
    if (!nameChanged && !editing.imageUri) {
      setEditing(null); // nothing changed
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await updateSavedPerson(editing.id, {
        name: nameChanged ? name : undefined,
        imageUri: editing.imageUri,
      });
      setSaved((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setEditing(null);
    } catch (err) {
      Alert.alert('Could not update', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSavingEdit(false);
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
            setGroups((prev) =>
              prev.map((g) => ({ ...g, memberIds: g.memberIds.filter((id) => id !== person._id) }))
            );
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

  const handleUseSelected = () => {
    const chosen = saved.filter((p) => selected[p._id]);
    // Replace (not append) so changing the selection and pressing Use Selected
    // again never leaves previous picks or duplicates in the session.
    replacePeople(
      chosen.map((p) => ({ name: p.name, imageUri: p.imageUrl, savedId: p._id }))
    );
    navigation.navigate('Review');
  };

  // ---------------------------------------------------------------- render --

  const renderRow = (person: SavedPerson) => {
    if (editing?.id === person._id) {
      const photoUri = editing.imageUri ?? person.imageUrl;
      return (
        <View
          key={person._id}
          style={[styles.editRow, { backgroundColor: colors.card, borderColor: colors.primary }]}
        >
          <View style={styles.editTop}>
            <Pressable
              onPress={() => choosePhoto((uri) => setEditing((e) => (e ? { ...e, imageUri: uri } : e)))}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.placeholder }]}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                </View>
              )}
            </Pressable>
            <TextInput
              value={editing.name}
              onChangeText={(t) => setEditing((e) => (e ? { ...e, name: t } : e))}
              placeholder="Name"
              placeholderTextColor={colors.subtext}
              autoFocus
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          </View>
          <Text style={[styles.editHint, { color: colors.subtext }]}>Tap the photo to change it.</Text>
          <View style={styles.editActions}>
            <PrimaryButton
              title="Cancel"
              variant="secondary"
              onPress={() => setEditing(null)}
              disabled={savingEdit}
              style={styles.half}
            />
            <PrimaryButton
              title={savingEdit ? 'Saving…' : 'Save'}
              onPress={handleSaveEdit}
              disabled={savingEdit}
              style={styles.half}
            />
          </View>
        </View>
      );
    }

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
        <Pressable onPress={() => startEdit(person)} hitSlop={10}>
          <Text style={[styles.action, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => handleDelete(person)} hitSlop={10} style={{ marginLeft: 14 }}>
          <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
        </Pressable>
      </Pressable>
    );
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
          <PrimaryButton
            title="Retry"
            variant="secondary"
            onPress={() => load('initial')}
            style={{ marginTop: 12 }}
          />
        </View>
      ) : (
        <>
          {saved.length > 0 && (
            <>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search saved people"
                placeholderTextColor={colors.subtext}
                style={[styles.search, { color: colors.text, borderColor: colors.border }]}
                autoCorrect={false}
              />
              <View style={styles.selectBar}>
                <Pressable onPress={selectAllVisible} hitSlop={8}>
                  <Text style={[styles.action, { color: colors.primary }]}>
                    Select all{query.trim() ? ' shown' : ''} ({filtered.length})
                  </Text>
                </Pressable>
                <Pressable onPress={clearSelection} hitSlop={8} disabled={selectedCount === 0}>
                  <Text
                    style={[
                      styles.action,
                      { color: colors.subtext, opacity: selectedCount === 0 ? 0.4 : 1 },
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load('refresh')}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {groups.length > 0 && (
              <View style={styles.groupsWrap}>
                <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
                  Groups · tap to select · hold to delete
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {groups.map((g) => {
                    const active = isGroupActive(g);
                    const count = g.memberIds.filter((id) => saved.some((p) => p._id === id)).length;
                    return (
                      <Pressable
                        key={g._id}
                        onPress={() => applyGroup(g)}
                        onLongPress={() => handleDeleteGroup(g)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.card,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '600' }}>
                          👥 {g.name} ({count})
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {saved.length === 0 ? (
              <Text style={[styles.empty, { color: colors.subtext }]}>
                No saved people yet — add one below.
              </Text>
            ) : filtered.length === 0 ? (
              <Text style={[styles.empty, { color: colors.subtext }]}>No one matches your search.</Text>
            ) : (
              filtered.map(renderRow)
            )}

            {selectedCount > 0 && (
              <View style={[styles.newCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.newLabel, { color: colors.subtext }]}>
                  Save {selectedCount} selected as a group
                </Text>
                <View style={styles.newRow}>
                  <TextInput
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder='Group name, e.g. "Family"'
                    placeholderTextColor={colors.subtext}
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>
                <PrimaryButton
                  title={savingGroup ? 'Saving…' : 'Save Group'}
                  variant="secondary"
                  onPress={handleSaveGroup}
                  disabled={savingGroup}
                  style={{ marginTop: 12 }}
                />
              </View>
            )}

            <View style={[styles.newCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.newLabel, { color: colors.subtext }]}>Add a new saved person</Text>
              <View style={styles.newRow}>
                <Pressable onPress={() => choosePhoto(setNewImageUri)} style={styles.photoWrap}>
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
        </>
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
  search: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  selectBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  groupsWrap: { marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  editRow: { borderRadius: 16, borderWidth: 2, padding: 12, marginBottom: 10 },
  editTop: { flexDirection: 'row', alignItems: 'center' },
  editHint: { fontSize: 12, marginTop: 8 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
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
  action: { fontSize: 13, fontWeight: '600' },
  newCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginTop: 8 },
  newLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  newRow: { flexDirection: 'row', alignItems: 'center' },
  photoWrap: { marginRight: 12 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  footer: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  half: { flex: 1 },
});
