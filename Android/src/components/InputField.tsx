// Labelled numeric text input — port of InputFieldSection.

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  title: string;
  value: string;
  onChangeText: (value: string) => void;
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
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d5da',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
});
