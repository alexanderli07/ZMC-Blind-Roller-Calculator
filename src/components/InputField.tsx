// Port of InputFieldSection from ContentView.swift.

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  title: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default function InputField({ title, value, onChangeText }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={title}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
});
