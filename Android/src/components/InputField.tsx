// Labelled numeric text input.

import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ThemeColors, useTheme } from '../theme/theme';
import { font, MIN_TOUCH, radius, space } from '../theme/tokens';

interface Props {
  title: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  testID?: string;
}

export default function InputField({
  title,
  value,
  onChangeText,
  placeholder,
  error,
  testID,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? title}
        placeholderTextColor={colors.textSubtle}
        selectionColor={colors.primary}
        keyboardType="decimal-pad"
        testID={testID}
      />
      {/* Always present so an appearing error cannot resize the card. */}
      <Text style={styles.error} numberOfLines={1}>
        {error ?? ' '}
      </Text>
    </View>
  );
}

const ERROR_LINE = 15;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '500',
    marginBottom: space.xs,
  },
  input: {
    minHeight: MIN_TOUCH,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    fontSize: font.title,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: font.footnote,
    height: ERROR_LINE,
    lineHeight: ERROR_LINE,
    marginTop: space.xs,
  },
});
