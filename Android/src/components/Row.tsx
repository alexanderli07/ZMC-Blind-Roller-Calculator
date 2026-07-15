// One line in a grouped card: a label, an optional value, and either a
// chevron or a control on the right. Used for the calculator's selectors and
// for every settings row.

import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemeColors, useTheme } from '../theme/theme';
import { font, MIN_TOUCH, space } from '../theme/tokens';

interface Props {
  label: string;
  value?: string | null;
  placeholder?: string | null;
  detail?: string | null;
  tone?: 'default' | 'danger';
  chevron?: boolean;
  divider?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  right?: ReactNode;
  a11yLabel?: string;
  testID?: string;
}

export default function Row({
  label,
  value,
  placeholder,
  detail,
  tone = 'default',
  chevron = false,
  divider = false,
  disabled = false,
  onPress,
  right,
  a11yLabel,
  testID,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const shown = value && value !== '' ? value : null;
  const style = [styles.row, divider && styles.divider, disabled && styles.disabled];

  const content = (
    <>
      <View style={styles.labelColumn}>
        <Text style={[styles.label, tone === 'danger' && styles.labelDanger]}>{label}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}
      </View>
      {(shown || placeholder) && (
        <Text style={shown ? styles.value : styles.placeholder} numberOfLines={1}>
          {shown ?? placeholder}
        </Text>
      )}
      {right}
      {chevron && <Text style={styles.chevron}>›</Text>}
    </>
  );

  if (!onPress) {
    return (
      <View style={style} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? (shown ? `${label}: ${shown}` : label)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={style}
      testID={testID}
    >
      {content}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  disabled: {
    opacity: 0.4,
  },
  labelColumn: {
    flex: 1,
    paddingRight: space.sm,
  },
  label: {
    fontSize: font.label,
    fontWeight: '500',
    color: colors.textMuted,
  },
  labelDanger: {
    color: colors.danger,
    fontWeight: '600',
  },
  detail: {
    marginTop: 1,
    fontSize: font.caption,
    color: colors.textSubtle,
  },
  value: {
    flexShrink: 1,
    fontSize: font.label,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  placeholder: {
    flexShrink: 1,
    fontSize: font.label,
    color: colors.textSubtle,
    textAlign: 'right',
  },
  chevron: {
    marginLeft: space.sm,
    fontSize: font.heading,
    lineHeight: font.heading + 2,
    color: colors.textSubtle,
  },
});
