// Blind width and height, with the unit toggle sitting on the card it
// governs. The toggle writes straight to the units setting, so the readouts
// and the entry fields can never disagree.

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { UnitSystem, unitSuffix } from '../format';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, space } from '../theme/tokens';
import InputField from './InputField';
import Section from './Section';
import SegmentedControl, { SegmentOption } from './SegmentedControl';

const UNIT_OPTIONS: SegmentOption<UnitSystem>[] = [
  { value: 'imperial', label: 'in', a11yLabel: 'Inches' },
  { value: 'metric', label: 'mm', a11yLabel: 'Millimetres' },
];

interface Props {
  width: string;
  height: string;
  units: UnitSystem;
  widthError?: string;
  heightError?: string;
  onChangeWidth: (value: string) => void;
  onChangeHeight: (value: string) => void;
  onChangeUnits: (units: UnitSystem) => void;
}

export default function DimensionsCard({
  width,
  height,
  units,
  widthError,
  heightError,
  onChangeWidth,
  onChangeHeight,
  onChangeUnits,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const suffix = unitSuffix(units);

  return (
    <Section padded>
      <View style={styles.header}>
        <Text style={styles.caption}>Dimensions</Text>
        <View style={styles.toggle}>
          <SegmentedControl
            compact
            options={UNIT_OPTIONS}
            value={units}
            onChange={onChangeUnits}
            testID="unit-toggle"
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <InputField
          title="Width"
          placeholder={suffix}
          value={width}
          onChangeText={onChangeWidth}
          error={widthError}
          testID="blind-width-input"
        />
        <Text style={styles.times}>×</Text>
        <InputField
          title="Height"
          placeholder={suffix}
          value={height}
          onChangeText={onChangeHeight}
          error={heightError}
          testID="blind-height-input"
        />
      </View>
    </Section>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  caption: {
    fontSize: font.caption,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  toggle: {
    width: 108,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Nudged down so the glyph sits on the inputs rather than their labels.
  times: {
    marginTop: 30,
    marginHorizontal: space.sm,
    fontSize: font.footnote,
    color: colors.textSubtle,
  },
});
