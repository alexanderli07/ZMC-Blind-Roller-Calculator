// Everything that used to be a three-option Appearance modal. Presented as a
// full screen over the calculator so the calculator keeps its state.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomItemsSheet, { CustomGroup } from '../components/CustomItemsSheet';
import Row from '../components/Row';
import Section from '../components/Section';
import SegmentedControl, { SegmentOption } from '../components/SegmentedControl';
import { lengthLabel, MM_PER_IN, UnitSystem } from '../format';
import { useSettings } from '../settings/settings';
import {
  clearSelection,
  MAX_DECIMALS,
  MIN_DECIMALS,
} from '../settings/settingsStorage';
import {
  clearAllCustom,
  exportLibrary,
  importLibrary,
  loadCustomBottomBars,
  loadCustomFabricTypes,
  loadCustomTubes,
  removeBottomBar,
  removeFabricType,
  removeTube,
} from '../storage';
import { ThemeColors, ThemePreference, useTheme } from '../theme/theme';
import { font, MIN_TOUCH, radius, space } from '../theme/tokens';

const APPEARANCE_OPTIONS: SegmentOption<ThemePreference>[] = [
  { value: 'system', label: 'System', a11yLabel: 'System appearance' },
  { value: 'light', label: 'Light', a11yLabel: 'Light appearance' },
  { value: 'dark', label: 'Dark', a11yLabel: 'Dark appearance' },
];

const UNIT_OPTIONS: SegmentOption<UnitSystem>[] = [
  { value: 'imperial', label: 'Imperial', a11yLabel: 'Imperial units' },
  { value: 'metric', label: 'Metric', a11yLabel: 'Metric units' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsScreen({ visible, onClose }: Props) {
  const { colors, preference, setPreference, saveError: themeError } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, update, reset, saveError } = useSettings();

  const [customTubes, setCustomTubes] = useState<string[]>([]);
  const [customFabrics, setCustomFabrics] = useState<string[]>([]);
  const [customBottomBars, setCustomBottomBars] = useState<string[]>([]);
  const [customVisible, setCustomVisible] = useState(false);

  const [limitVisible, setLimitVisible] = useState(false);
  const [limitText, setLimitText] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);

  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const refreshCustom = useCallback(async () => {
    const [tubes, fabrics, bars] = await Promise.all([
      loadCustomTubes(),
      loadCustomFabricTypes(),
      loadCustomBottomBars(),
    ]);
    setCustomTubes(tubes.map((item) => item.name));
    setCustomFabrics(fabrics.map((item) => item.name));
    setCustomBottomBars(bars.map((item) => item.name));
  }, []);

  useEffect(() => {
    if (visible) void refreshCustom();
  }, [visible, refreshCustom]);

  const customCount = customTubes.length + customFabrics.length + customBottomBars.length;

  const groups: CustomGroup[] = [
    { key: 'tube', title: 'Tubes', items: customTubes },
    { key: 'fabric', title: 'Fabric types', items: customFabrics },
    { key: 'bottomBar', title: 'Bottom bars', items: customBottomBars },
  ];

  const removeCustom = async (groupKey: string, name: string) => {
    if (groupKey === 'tube') await removeTube(name);
    else if (groupKey === 'fabric') await removeFabricType(name);
    else await removeBottomBar(name);
    await refreshCustom();
  };

  const { units, maxDeflectionIn } = settings;
  const limitLabel = lengthLabel(maxDeflectionIn, units, settings.deflectionDecimals);

  const openLimit = () => {
    const shown = units === 'imperial' ? maxDeflectionIn : maxDeflectionIn * MM_PER_IN;
    setLimitText(String(Number(shown.toFixed(4))));
    setLimitError(null);
    setLimitVisible(true);
  };

  const saveLimit = () => {
    const parsed = Number(limitText.trim());
    if (limitText.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) {
      setLimitError('Enter a number greater than 0.');
      return;
    }
    const inches = units === 'imperial' ? parsed : parsed / MM_PER_IN;
    void update({ maxDeflectionIn: inches });
    setLimitVisible(false);
  };

  const exportNow = async () => {
    const library = await exportLibrary();
    const total =
      library.fabricTypes.length + library.tubes.length + library.bottomBars.length;
    if (total === 0) {
      Alert.alert('Nothing to export', 'You have not added any custom items yet.');
      return;
    }
    try {
      await Share.share({ message: JSON.stringify(library, null, 2) });
    } catch {
      // Dismissed, or no share target available.
    }
  };

  const openImport = () => {
    setImportText('');
    setImportError(null);
    setImportVisible(true);
  };

  const runImport = async () => {
    const result = await importLibrary(importText);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setImportVisible(false);
    await refreshCustom();
    const skipped = result.skipped > 0 ? ` ${result.skipped} already existed.` : '';
    Alert.alert('Import finished', `Added ${result.added} item(s).${skipped}`);
  };

  const confirmRemoveAll = () => {
    if (customCount === 0) {
      Alert.alert('Nothing to remove', 'You have not added any custom items yet.');
      return;
    }
    Alert.alert(
      'Remove all custom items',
      `This deletes ${customCount} item(s) you added. The bundled defaults stay.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove all',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearAllCustom();
              await refreshCustom();
            })();
          },
        },
      ]
    );
  };

  const confirmResetSettings = () => {
    Alert.alert('Reset settings', 'Put appearance, units, precision, and limits back to their defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await reset();
            await setPreference('system');
            await clearSelection();
          })();
        },
      },
    ]);
  };

  const decimalsRow = (
    label: string,
    value: number,
    apply: (next: number) => void,
    divider: boolean
  ) => (
    <Row
      label={label}
      divider={divider}
      right={<Stepper colors={colors} label={label} value={value} onChange={apply} />}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} testID="settings-screen">
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.iconButton}
            onPress={onClose}
          >
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Section title="Appearance" padded>
            <SegmentedControl
              options={APPEARANCE_OPTIONS}
              value={preference}
              onChange={(next) => void setPreference(next)}
              testID="appearance-toggle"
            />
            {themeError && <Text style={styles.error}>{themeError}</Text>}
          </Section>

          <Section title="Units">
            <View style={styles.inset}>
              <SegmentedControl
                options={UNIT_OPTIONS}
                value={units}
                onChange={(next) => void update({ units: next })}
                testID="units-toggle"
              />
            </View>
            <Row
              label="Show second unit"
              a11yLabel="Show second unit"
              right={
                <Switch
                  accessibilityLabel="Show second unit"
                  value={settings.showSecondaryUnit}
                  onValueChange={(next) => void update({ showSecondaryUnit: next })}
                  trackColor={{ true: colors.primary, false: colors.surfaceSecondary }}
                  thumbColor={colors.surface}
                />
              }
            />
          </Section>

          <Section
            title="Decimal places"
            footnote="Deflection needs more places than a weight in pounds does."
          >
            {decimalsRow(
              'Weight',
              settings.weightDecimals,
              (next) => void update({ weightDecimals: next }),
              true
            )}
            {decimalsRow(
              'Roller diameter',
              settings.diameterDecimals,
              (next) => void update({ diameterDecimals: next }),
              true
            )}
            {decimalsRow(
              'Deflection',
              settings.deflectionDecimals,
              (next) => void update({ deflectionDecimals: next }),
              false
            )}
          </Section>

          <Section title="Tolerances" footnote="Readings above this show as over limit.">
            <Row
              label="Max deflection"
              value={limitLabel}
              chevron
              onPress={openLimit}
              testID="max-deflection-row"
            />
          </Section>

          <Section title="Behaviour">
            <Row
              label="Remember last selections"
              a11yLabel="Remember last selections"
              right={
                <Switch
                  accessibilityLabel="Remember last selections"
                  value={settings.rememberSelections}
                  onValueChange={(next) => void update({ rememberSelections: next })}
                  trackColor={{ true: colors.primary, false: colors.surfaceSecondary }}
                  thumbColor={colors.surface}
                />
              }
            />
          </Section>

          <Section title="Your library">
            <Row
              label="Custom items"
              value={String(customCount)}
              chevron
              divider
              onPress={() => setCustomVisible(true)}
              testID="custom-items-row"
            />
            <Row
              label="Export library"
              detail="Share the items you added as JSON"
              divider
              onPress={() => void exportNow()}
            />
            <Row
              label="Import library"
              detail="Paste exported JSON"
              divider
              onPress={openImport}
            />
            <Row label="Remove all custom items" tone="danger" onPress={confirmRemoveAll} />
          </Section>

          <Section title="Reset">
            <Row label="Reset settings" tone="danger" onPress={confirmResetSettings} />
          </Section>

          {saveError && <Text style={styles.error}>{saveError}</Text>}
        </ScrollView>

        <CustomItemsSheet
          visible={customVisible}
          groups={groups}
          onRemove={(groupKey, name) => void removeCustom(groupKey, name)}
          onClose={() => setCustomVisible(false)}
        />

        <PromptModal
          visible={limitVisible}
          title="Max deflection"
          description={`Entered in ${units === 'imperial' ? 'inches' : 'millimetres'}.`}
          value={limitText}
          onChangeText={setLimitText}
          error={limitError}
          numeric
          confirmLabel="Save"
          onConfirm={saveLimit}
          onCancel={() => setLimitVisible(false)}
          colors={colors}
          testID="max-deflection-modal"
        />

        <PromptModal
          visible={importVisible}
          title="Import library"
          description="Paste the JSON from an export. Existing names are skipped."
          value={importText}
          onChangeText={setImportText}
          error={importError}
          multiline
          confirmLabel="Import"
          onConfirm={() => void runImport()}
          onCancel={() => setImportVisible(false)}
          colors={colors}
          testID="import-modal"
        />
      </SafeAreaView>
    </Modal>
  );
}

interface StepperProps {
  colors: ThemeColors;
  label: string;
  value: number;
  onChange: (next: number) => void;
}

function Stepper({ colors, label, value, onChange }: StepperProps) {
  const styles = useMemo(() => createStepperStyles(colors), [colors]);
  const atMin = value <= MIN_DECIMALS;
  const atMax = value >= MAX_DECIMALS;

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Fewer decimal places for ${label.toLowerCase()}`}
        accessibilityState={{ disabled: atMin }}
        disabled={atMin}
        style={[styles.button, atMin && styles.buttonDisabled]}
        onPress={() => onChange(value - 1)}
      >
        <Text style={styles.symbol}>−</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`More decimal places for ${label.toLowerCase()}`}
        accessibilityState={{ disabled: atMax }}
        disabled={atMax}
        style={[styles.button, atMax && styles.buttonDisabled]}
        onPress={() => onChange(value + 1)}
      >
        <Text style={styles.symbol}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

interface PromptProps {
  visible: boolean;
  title: string;
  description?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  numeric?: boolean;
  multiline?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  colors: ThemeColors;
  testID?: string;
}

function PromptModal({
  visible,
  title,
  description,
  value,
  onChangeText,
  error,
  numeric = false,
  multiline = false,
  confirmLabel,
  onConfirm,
  onCancel,
  colors,
  testID,
}: PromptProps) {
  const styles = useMemo(() => createPromptStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID={testID}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={numeric ? 'decimal-pad' : 'default'}
            multiline={multiline}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={multiline ? '{ "version": 1, … }' : ''}
            placeholderTextColor={colors.textSubtle}
            selectionColor={colors.primary}
            testID={testID ? `${testID}-input` : undefined}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={[styles.button, styles.cancel]}
              onPress={onCancel}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[styles.button, styles.confirm]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.primary,
  },
  title: {
    flex: 1,
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  scroll: {
    padding: space.md,
    paddingBottom: space.xl,
  },
  inset: {
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  error: {
    marginTop: space.sm,
    fontSize: font.footnote,
    color: colors.danger,
  },
});

const createStepperStyles = (colors: ThemeColors) => StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  symbol: {
    fontSize: font.title,
    fontWeight: '700',
    color: colors.text,
  },
  value: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
});

const createPromptStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
    backgroundColor: colors.overlay,
  },
  sheet: {
    borderRadius: radius.lg,
    padding: space.xl,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    marginTop: space.xs,
    fontSize: font.footnote,
    color: colors.textMuted,
  },
  input: {
    marginTop: space.md,
    minHeight: MIN_TOUCH,
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: font.body,
  },
  inputMultiline: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: space.sm,
    fontSize: font.footnote,
    color: colors.danger,
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
  cancel: {
    marginRight: space.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  cancelLabel: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  confirm: {
    backgroundColor: colors.primary,
  },
  confirmLabel: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
