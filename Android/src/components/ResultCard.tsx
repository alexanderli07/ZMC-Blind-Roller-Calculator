// The headline readout. Sits above the inputs so the answer is never below
// the fold.

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Reading } from '../format';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, radius, space } from '../theme/tokens';

interface Props {
  label: string;
  reading: Reading;
  hint?: string | null;
  testID?: string;
}

export default function ResultCard({ label, reading, hint, testID }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{reading.value}</Text>
        {reading.unit !== '' && <Text style={styles.unit}>{` ${reading.unit}`}</Text>}
      </View>
      {reading.secondary && <Text style={styles.secondary}>{reading.secondary}</Text>}
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  label: {
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: space.xs,
  },
  value: {
    fontSize: font.hero,
    fontWeight: '700',
    color: colors.text,
  },
  unit: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  secondary: {
    marginTop: 2,
    fontSize: font.footnote,
    color: colors.textSubtle,
  },
  hint: {
    marginTop: space.sm,
    fontSize: font.footnote,
    color: colors.textMuted,
  },
});
