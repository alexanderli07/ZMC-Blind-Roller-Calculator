// Secondary readout. The status pill is what turns the deflection limit from a
// footnote into an answer, so it sits up on the label row where the eye lands
// first rather than buried under the number.
//
// The pill's row and the secondary-unit line are both reserved whether or not
// they have content, so the tile does not change height once inputs land.

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
      <View style={styles.headerRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {status && (
          <View style={[styles.chip, over ? styles.chipOver : styles.chipOk]}>
            <Text style={[styles.chipLabel, over ? styles.chipLabelOver : styles.chipLabelOk]}>
              {status.label}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, over && styles.valueOver]} numberOfLines={1}>
          {reading.value}
        </Text>
        {reading.unit !== '' && (
          <Text style={[styles.unit, over && styles.unitOver]}>{` ${reading.unit}`}</Text>
        )}
      </View>

      <Text style={styles.secondary} numberOfLines={1}>
        {reading.secondary ?? ' '}
      </Text>
      {caption && (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      )}
    </View>
  );
}

const CHIP_ROW = 22;
const SUB_LINE = 14;

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
  headerRow: {
    minHeight: CHIP_ROW,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flexShrink: 1,
    paddingRight: space.xs,
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  chip: {
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: space.xs,
  },
  value: {
    fontSize: font.title,
    lineHeight: font.title + 4,
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
    height: SUB_LINE,
    lineHeight: SUB_LINE,
    fontSize: font.caption,
    color: colors.textSubtle,
  },
  caption: {
    marginTop: space.xs,
    height: SUB_LINE,
    lineHeight: SUB_LINE,
    fontSize: font.caption,
    color: colors.textSubtle,
  },
});
