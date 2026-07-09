// Wheel/dropdown picker with a "+" add button — port of ScrollablePickerSection.

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemeColors, useTheme } from '../theme/theme';

interface Props {
  title: string;
  options: string[];
  selection: string;
  onSelect: (value: string) => void;
  onAdd?: () => void;
}

export default function ScrollablePicker({
  title,
  options,
  selection,
  onSelect,
  onAdd,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const testID = `${title.toLowerCase().replace(/\s+/g, '-')}-picker`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onAdd && (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pickerWrapper} testID={`${testID}-wrapper`}>
        <Picker
          selectedValue={selection}
          onValueChange={(value) => onSelect(String(value))}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          dropdownIconColor={colors.textMuted}
          testID={testID}
        >
          <Picker.Item label="Choose an option…" value="" />
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

// On iOS the Picker is a tall spinning wheel; clip it to a compact height so
// all three pickers + inputs + results fit on screen without scrolling.
// On Android the Picker is already a compact dropdown.
const PICKER_HEIGHT = Platform.OS === 'ios' ? 88 : 48;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    height: PICKER_HEIGHT,
    justifyContent: 'center',
  },
  picker: {
    height: PICKER_HEIGHT,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  pickerItem: {
    height: PICKER_HEIGHT,
    fontSize: 16,
    color: colors.text,
  },
});
