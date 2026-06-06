// Generic "add new item" modal — covers AddFabricTypeView, AddTubeView and
// AddBottomBarView from the iOS app. Each field is either text or a decimal
// number; the parent supplies the field spec and receives the built object.

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export interface FieldSpec {
  key: string;
  label: string;
  numeric: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  fields: FieldSpec[];
  onCancel: () => void;
  // Called with the collected values once every required field is valid.
  onSubmit: (values: Record<string, string>) => void;
}

export default function AddItemModal({
  visible,
  title,
  fields,
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  const setValue = (key: string, text: string) =>
    setValues((prev) => ({ ...prev, [key]: text }));

  // Mirrors the iOS guard: name non-empty, every numeric field a valid Double.
  const isValid = fields.every((f) => {
    const v = (values[f.key] ?? '').trim();
    if (v === '') return false;
    if (f.numeric && Number.isNaN(Number(v))) return false;
    return true;
  });

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(values);
    setValues({});
  };

  const handleCancel = () => {
    setValues({});
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.navBar}>
          <Text style={styles.navTitle}>{title}</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          {fields.map((f) => (
            <View key={f.key} style={styles.fieldGroup}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={values[f.key] ?? ''}
                onChangeText={(t) => setValue(f.key, t)}
                placeholder={f.label}
                keyboardType={f.numeric ? 'decimal-pad' : 'default'}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.submit, !isValid && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={styles.submitText}>{title}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  form: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
  submit: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitDisabled: {
    backgroundColor: '#9bc4ff',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
