// Generic "add new item" modal — port of AddFabricTypeView / AddTubeView /
// AddBottomBarView, driven by a list of field specs.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ValidationResult } from '../validation';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, MIN_TOUCH, radius, space } from '../theme/tokens';

export interface FieldSpec {
  key: string;
  label: string;
  numeric: boolean;
}

function emptyValuesFor(fields: FieldSpec[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((values, field) => {
    values[field.key] = '';
    return values;
  }, {});
}

interface Props<T> {
  visible: boolean;
  title: string;
  fields: FieldSpec[];
  onCancel: () => void;
  validate: (values: Record<string, string>) => ValidationResult<T>;
  onSubmit: (value: T) => Promise<void> | void;
  onRemoveAll?: () => Promise<void> | void;
  removeAllLabel?: string;
}

export default function AddItemModal<T,>({
  visible,
  title,
  fields,
  onCancel,
  validate,
  onSubmit,
  onRemoveAll,
  removeAllLabel,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [values, setValues] = useState<Record<string, string>>(() => emptyValuesFor(fields));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const wasVisible = useRef(false);

  // Reset only on an idle open; reopening cannot supersede pending work.
  useEffect(() => {
    if (visible && !wasVisible.current && !inFlight.current) {
      setValues(emptyValuesFor(fields));
      setError(null);
      setSubmitting(false);
    }
    wasVisible.current = visible;
  }, [fields, visible]);

  const setField = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => {
    if (inFlight.current) return;
    onCancel();
  };

  const handleConfirm = async () => {
    if (inFlight.current) return;

    const result = validate(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    inFlight.current = true;
    setSubmitting(true);
    try {
      await onSubmit(result.value);
    } catch {
      setError('Could not save the item. Please try again.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleRemoveAll = async () => {
    if (!onRemoveAll || inFlight.current) return;

    setError(null);
    inFlight.current = true;
    setSubmitting(true);
    try {
      await onRemoveAll();
    } catch {
      setError('Could not remove the items. Please try again.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="add-item-sheet">
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
                  placeholderTextColor={colors.textSubtle}
                  selectionColor={colors.primary}
                />
              </View>
            ))}
          </ScrollView>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                submitting && styles.disabledButton,
              ]}
              disabled={submitting}
              onPress={handleCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                submitting && styles.disabledButton,
              ]}
              disabled={submitting}
              onPress={handleConfirm}
            >
              <Text style={styles.saveText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {onRemoveAll && (
            <TouchableOpacity
              style={[styles.removeAllButton, submitting && styles.disabledButton]}
              disabled={submitting}
              onPress={handleRemoveAll}
            >
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    maxHeight: '85%',
  },
  title: {
    color: colors.text,
    fontSize: font.heading,
    fontWeight: '700',
    marginBottom: space.lg,
  },
  fieldRow: {
    marginBottom: space.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.label,
    fontWeight: '500',
    marginBottom: space.xs,
  },
  input: {
    minHeight: MIN_TOUCH,
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    fontSize: font.body,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: space.lg,
  },
  button: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceSecondary,
    marginRight: space.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: space.sm,
  },
  disabledButton: {
    opacity: 0.4,
  },
  cancelText: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  saveText: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  errorText: {
    color: colors.danger,
    fontSize: font.footnote,
    marginTop: space.sm,
  },
  removeAllButton: {
    marginTop: space.md,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAllText: {
    fontSize: font.footnote,
    fontWeight: '600',
    color: colors.danger,
  },
});
