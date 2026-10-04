import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, HistoryEntry } from '../types/person';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { fetchHistory, deleteHistoryEntry, clearHistory, ApiError } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString(
    undefined,
    { hour: 'numeric', minute: '2-digit' }
  )}`;
}

export default function HistoryScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
      setLoadError(null);
    } else {
      setRefreshing(true);
    }
    try {
      setItems(await fetchHistory());
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : 'Could not reach the server. Check that the API is running and EXPO_PUBLIC_API_URL is set.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  const handleDelete = (item: HistoryEntry) => {
    Alert.alert('Remove from history', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHistoryEntry(item._id);
            setItems((prev) => prev.filter((i) => i._id !== item._id));
          } catch (err) {
            Alert.alert('Could not delete', err instanceof ApiError ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Clear history', 'Delete every past pick? This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearHistory();
            setItems([]);
          } catch (err) {
            Alert.alert('Could not clear', err instanceof ApiError ? err.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Winner History</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        Every pick you've made, saved to your account.
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {items.length === 0 ? (
            <Text style={[styles.empty, { color: colors.subtext }]}>
              No picks yet — your results will show up here.
            </Text>
          ) : (
            items.map((item) => (
              <Pressable
                key={item._id}
                onLongPress={() => handleDelete(item)}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHead}>
                  <Text style={[styles.when, { color: colors.subtext }]}>{formatWhen(item.createdAt)}</Text>
                  <Pressable onPress={() => handleDelete(item)} hitSlop={10}>
                    <Text style={[styles.delete, { color: colors.danger }]}>Delete</Text>
                  </Pressable>
                </View>
                {item.winners.map((w, i) => (
                  <View key={`${item._id}-${i}`} style={styles.winnerRow}>
                    {w.imageUrl ? (
                      <Image source={{ uri: w.imageUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.placeholder }]}>
                        <Text style={{ fontSize: 16 }}>🙂</Text>
                      </View>
                    )}
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {item.winners.length > 1 ? `${i + 1}. ` : ''}
                      {w.name}
                    </Text>
                  </View>
                ))}
                <Text style={[styles.pool, { color: colors.subtext }]}>
                  Picked from {item.poolSize} {item.poolSize === 1 ? 'person' : 'people'}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <PrimaryButton title="Back" variant="secondary" onPress={() => navigation.goBack()} style={styles.half} />
        <PrimaryButton
          title="Clear All"
          variant="danger"
          onPress={handleClear}
          disabled={items.length === 0}
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
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  when: { fontSize: 12, fontWeight: '600' },
  delete: { fontSize: 12, fontWeight: '600' },
  winnerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: '700' },
  pool: { fontSize: 12, marginTop: 10 },
  footer: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  half: { flex: 1 },
});
