// Wheel/dropdown picker with a "+" add button — port of ScrollablePickerSection.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

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

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selection}
          onValueChange={(value) => onSelect(String(value))}
          style={styles.picker}
          itemStyle={styles.pickerItem}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d5da',
    overflow: 'hidden',
    height: PICKER_HEIGHT,
    justifyContent: 'center',
  },
  picker: {
    height: PICKER_HEIGHT,
  },
  pickerItem: {
    height: PICKER_HEIGHT,
    fontSize: 16,
  },
});
