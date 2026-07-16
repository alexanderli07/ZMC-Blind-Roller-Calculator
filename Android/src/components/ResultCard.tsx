// The headline readout. Sits above the inputs so the answer is never below
// the fold.
//
// Every slot is reserved whether or not it has content, so the card is exactly
// as tall before you enter anything as it is after. The secondary unit and the
// empty-state hint deliberately share one line for the same reason.

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
  const showingHint = reading.secondary === null && !!hint;
  const sub = reading.secondary ?? hint ?? ' ';

  return (
    <View style={styles.card} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1}>
          {reading.value}
        </Text>
        {reading.unit !== '' && <Text style={styles.unit}>{` ${reading.unit}`}</Text>}
      </View>
      <Text style={[styles.sub, showingHint && styles.subHint]} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

const SUB_LINE = 16;

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
    lineHeight: font.hero + 4,
    fontWeight: '700',
    color: colors.text,
  },
  unit: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sub: {
    marginTop: 2,
    height: SUB_LINE,
    lineHeight: SUB_LINE,
    fontSize: font.footnote,
    color: colors.textSubtle,
  },
  subHint: {
    color: colors.textMuted,
  },
});
