// Labelled numeric text input — port of InputFieldSection.

import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../theme/theme';

interface Props {
  title: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  testID?: string;
}

export default function InputField({ title, value, onChangeText, error, testID }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={title}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.primary}
        keyboardType="decimal-pad"
        testID={testID}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 3,
  },
});
