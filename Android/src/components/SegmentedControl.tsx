// Compact in-place choice control, shared by the unit toggle and the
// appearance setting.

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemeColors, useTheme } from '../theme/theme';
import { font, radius, space } from '../theme/tokens';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  a11yLabel?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  compact?: boolean;
  testID?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  compact = false,
  testID,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.track, disabled && styles.disabled]} testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.a11yLabel ?? option.label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            style={[
              styles.segment,
              compact && styles.segmentCompact,
              selected && styles.segmentSelected,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                selected && styles.labelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCompact: {
    minHeight: 28,
    paddingHorizontal: space.md,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: font.label,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelCompact: {
    fontSize: font.caption,
  },
  labelSelected: {
    color: colors.onPrimary,
  },
});
