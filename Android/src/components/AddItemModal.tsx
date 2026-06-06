// Generic "add new item" modal — port of AddFabricTypeView / AddTubeView /
// AddBottomBarView, driven by a list of field specs.

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
  onSubmit: (values: Record<string, string>) => void;
  onRemoveAll?: () => void;
  removeAllLabel?: string;
}

export default function AddItemModal({
  visible,
  title,
  fields,
  onCancel,
  onSubmit,
  onRemoveAll,
  removeAllLabel,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset the form each time the modal is opened.
  useEffect(() => {
    if (visible) setValues({});
  }, [visible]);

  const setField = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const allFilled = fields.every((f) => (values[f.key] ?? '').trim() !== '');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView>
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldRow}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={values[field.key] ?? ''}
                  onChangeText={(text) => setField(field.key, text)}
                  keyboardType={field.numeric ? 'decimal-pad' : 'default'}
                  placeholder={field.label}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                !allFilled && styles.disabledButton,
              ]}
              disabled={!allFilled}
              onPress={() => onSubmit(values)}
            >
              <Text style={styles.saveText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {onRemoveAll && (
            <TouchableOpacity style={styles.removeAllButton} onPress={onRemoveAll}>
              <Text style={styles.removeAllText}>
                {removeAllLabel ?? 'Remove all user-defined items'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d5da',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e9ec',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  removeAllButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e3b1b1',
    backgroundColor: '#fdf2f2',
    alignItems: 'center',
  },
  removeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c0392b',
  },
});
