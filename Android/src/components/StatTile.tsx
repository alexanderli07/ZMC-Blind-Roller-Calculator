// Secondary readout. The optional status chip is what turns the deflection
// limit from a footnote into an answer.

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Reading } from '../format';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, radius, space } from '../theme/tokens';

export type StatTone = 'ok' | 'over';

export interface StatStatus {
  label: string;
  tone: StatTone;
}

interface Props {
  label: string;
  reading: Reading;
  status?: StatStatus | null;
  caption?: string | null;
  testID?: string;
}

export default function StatTile({ label, reading, status, caption, testID }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const over = status?.tone === 'over';

  return (
    <View style={styles.tile} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, over && styles.valueOver]}>{reading.value}</Text>
        {reading.unit !== '' && (
          <Text style={[styles.unit, over && styles.unitOver]}>{` ${reading.unit}`}</Text>
        )}
      </View>
      {reading.secondary && <Text style={styles.secondary}>{reading.secondary}</Text>}
      {status && (
        <View style={[styles.chip, over ? styles.chipOver : styles.chipOk]}>
          <Text style={[styles.chipLabel, over ? styles.chipLabelOver : styles.chipLabelOk]}>
            {status.label}
          </Text>
        </View>
      )}
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
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
    marginTop: 2,
  },
  value: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  valueOver: {
    color: colors.danger,
  },
  unit: {
    fontSize: font.footnote,
    fontWeight: '600',
    color: colors.textMuted,
  },
  unitOver: {
    color: colors.danger,
  },
  secondary: {
    fontSize: font.caption,
    color: colors.textSubtle,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipOk: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  chipOver: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  chipLabel: {
    fontSize: font.caption,
    fontWeight: '700',
  },
  chipLabelOk: {
    color: colors.success,
  },
  chipLabelOver: {
    color: colors.danger,
  },
  caption: {
    marginTop: space.xs,
    fontSize: font.caption,
    color: colors.textSubtle,
  },
});
