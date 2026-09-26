import React from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import { Person } from '../types/person';
import { useThemeColors } from '../useThemeColors';

type Props = {
  index: number;
  person: Person;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onChangeName: (name: string) => void;
  errorMessage?: string;
};

export default function PersonCard({
  index,
  person,
  onPickImage,
  onRemoveImage,
  onChangeName,
  errorMessage,
}: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.subtext }]}>Person {index + 1}</Text>

      <View style={styles.row}>
        <Pressable onPress={onPickImage} style={styles.photoWrap}>
          {person.imageUri ? (
            <Image source={{ uri: person.imageUri }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.placeholder }]}>
              <Text style={{ fontSize: 22 }}>📷</Text>
            </View>
          )}
          <Text style={[styles.photoAction, { color: colors.primary }]}>
            {person.imageUri ? 'Change' : 'Add Photo'}
          </Text>
        </Pressable>

        <View style={styles.fields}>
          <TextInput
            value={person.name}
            onChangeText={onChangeName}
            placeholder="Enter name"
            placeholderTextColor={colors.subtext}
            style={[
              styles.input,
              { color: colors.text, borderColor: errorMessage ? colors.danger : colors.border },
            ]}
          />
          {errorMessage ? (
            <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text>
          ) : null}
          {person.imageUri ? (
            <Pressable onPress={onRemoveImage}>
              <Text style={[styles.removePhoto, { color: colors.subtext }]}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoWrap: {
    alignItems: 'center',
    marginRight: 14,
    width: 76,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAction: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  fields: {
    flex: 1,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  removePhoto: {
    fontSize: 12,
    marginTop: 6,
  },
});
