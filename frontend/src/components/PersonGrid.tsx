import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Person } from '../types/person';
import { useThemeColors } from '../useThemeColors';

type Props = {
  people: Person[];
  onEdit: (person: Person) => void;
};

export default function PersonGrid({ people, onEdit }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.grid}>
      {people.map((person) => (
        <View
          key={person.id}
          style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {person.imageUri ? (
            <Image source={{ uri: person.imageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.placeholder }]}>
              <Text style={{ fontSize: 20 }}>🙂</Text>
            </View>
          )}
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {person.name || 'Unnamed'}
          </Text>
          <Pressable onPress={() => onEdit(person)}>
            <Text style={[styles.edit, { color: colors.primary }]}>Edit</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    maxWidth: '90%',
  },
  edit: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
