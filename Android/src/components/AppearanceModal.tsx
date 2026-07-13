import React, { useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors, ThemePreference, useTheme } from '../theme/theme';

interface Props {
  visible: boolean;
  preference: ThemePreference;
  error: string | null;
  onCancel: () => void;
  onSelect: (preference: ThemePreference) => Promise<void>;
}

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceModal({ visible, preference, error, onCancel, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const choose = async (next: ThemePreference) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      await onSelect(next);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const cancel = () => {
    if (!inFlight.current) onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="appearance-modal-sheet">
          <Text style={styles.title}>Appearance</Text>
          {OPTIONS.map((option) => {
            const selected = option.value === preference;
            return (
              <TouchableOpacity
                key={option.value}
                accessibilityLabel={`${option.label} appearance`}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: saving }}
                disabled={saving}
                style={[styles.option, selected && styles.selectedOption]}
                onPress={() => { void choose(option.value); }}
              >
                <Text style={[styles.optionText, selected && styles.selectedText]}>{option.label}</Text>
                <Text style={styles.check}>{selected ? '✓' : ''}</Text>
              </TouchableOpacity>
            );
          })}
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity
            accessibilityLabel="Cancel appearance settings"
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            style={[styles.cancel, saving && styles.disabled]}
            onPress={cancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.overlay },
  sheet: { borderRadius: 14, padding: 20, backgroundColor: colors.surface },
  title: { marginBottom: 14, color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  option: {
    minHeight: 48,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 9,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.surfaceSecondary },
  optionText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  selectedText: { color: colors.primary },
  check: { minWidth: 20, color: colors.primary, fontSize: 18, fontWeight: '700', textAlign: 'right' },
  error: { marginTop: 4, color: colors.danger, fontSize: 14, textAlign: 'center' },
  cancel: { minHeight: 46, marginTop: 10, borderRadius: 9, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
