// Port of ScrollablePickerSection from ContentView.swift.
// On Android the native Picker renders as a dropdown/dialog (the platform
// equivalent of the iOS wheel picker), with a "+" button to add new options.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface Props {
  title: string;
  options: string[];
  selection: string;
  onSelect: (value: string) => void;
  onAdd: () => void;
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
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selection}
          onValueChange={(value) => onSelect(String(value))}
          mode="dropdown"
        >
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
