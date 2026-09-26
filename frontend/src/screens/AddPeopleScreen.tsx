import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import PersonCard from '../components/PersonCard';
import PrimaryButton from '../components/PrimaryButton';
import { useThemeColors } from '../useThemeColors';
import { usePeople } from '../context/PeopleContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPeople'>;

export default function AddPeopleScreen({ navigation, route }: Props) {
  const colors = useThemeColors();
  const { count } = route.params;
  const { people, setPeopleCount, updatePerson } = usePeople();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setPeopleCount(count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const pickImage = async (personId: string) => {
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickFromCamera(personId) },
      { text: 'Gallery', onPress: () => pickFromGallery(personId) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickFromCamera = async (personId: string) => {
    try {
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
      if (uri) updatePerson(personId, { imageUri: uri });
    } catch (e) {
      Alert.alert('Something went wrong', 'Could not open the camera.');
    }
  };

  const pickFromGallery = async (personId: string) => {
    try {
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
      // Handle cancellation gracefully — do nothing further.
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) updatePerson(personId, { imageUri: uri });
    } catch (e) {
      Alert.alert('Something went wrong', 'Could not open the photo library.');
    }
  };

  const validateAndContinue = () => {
    const nextErrors: Record<string, string> = {};
    people.forEach((p) => {
      if (!p.name.trim()) nextErrors[p.id] = 'Name is required';
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      navigation.navigate('Review');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Add People</Text>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {people.map((person, index) => (
          <PersonCard
            key={person.id}
            index={index}
            person={person}
            onPickImage={() => pickImage(person.id)}
            onRemoveImage={() => updatePerson(person.id, { imageUri: undefined })}
            onChangeName={(name) => {
              updatePerson(person.id, { name });
              if (errors[person.id]) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next[person.id];
                  return next;
                });
              }
            }}
            errorMessage={errors[person.id]}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Back" variant="secondary" onPress={() => navigation.goBack()} style={styles.half} />
        <PrimaryButton title="Continue" onPress={validateAndContinue} style={styles.half} />
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
    marginBottom: 16,
  },
  scroll: {
    paddingBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  half: {
    flex: 1,
  },
});
