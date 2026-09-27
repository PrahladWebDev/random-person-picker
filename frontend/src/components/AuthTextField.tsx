import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useThemeColors } from '../useThemeColors';

type Props = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export default function AuthTextField({ label, errorMessage, style, ...inputProps }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.subtext}
        style={[
          styles.input,
          { color: colors.text, borderColor: errorMessage ? colors.danger : colors.border },
          style,
        ]}
        {...inputProps}
      />
      {errorMessage ? (
        <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    fontSize: 13,
    marginTop: 4,
  },
});
