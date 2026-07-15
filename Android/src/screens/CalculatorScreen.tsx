// The main screen. Results sit above the inputs, the three selectors are rows
// that open searchable sheets, and the deflection reading is compared against
// the configured limit instead of leaving that to the reader.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AddItemModal, { FieldSpec } from '../components/AddItemModal';
import DimensionsCard from '../components/DimensionsCard';
import GearIcon from '../components/GearIcon';
import ResultCard from '../components/ResultCard';
import Row from '../components/Row';
import Section from '../components/Section';
import SelectSheet, { SheetItem } from '../components/SelectSheet';
import StatTile, { StatStatus } from '../components/StatTile';
import SettingsScreen from './SettingsScreen';
import {
  CalcInputs,
  parsePositiveNumber,
  rollerDiameterInch,
  rollerDiameterMm,
  totalWeightKg,
  totalWeightLb,
  tubeDeflectionInch,
  tubeDeflectionMm,
} from '../calculations';
import { bottomBarFromInputs, fabricFromInputs, tubeFromInputs } from '../conversions';
import { describeBottomBar, describeFabric, describeTube } from '../describe';
import {
  convertDimensionText,
  lengthLabel,
  lengthReading,
  Reading,
  toInchesText,
  UnitSystem,
  unitSuffix,
  weightReading,
} from '../format';
import { useSettings } from '../settings/settings';
import { clearSelection, loadSelection, saveSelection } from '../settings/settingsStorage';
import {
  addBottomBar,
  addFabricType,
  addTube,
  loadBottomBars,
  loadCustomBottomBars,
  loadCustomFabricTypes,
  loadCustomTubes,
  loadFabricTypes,
  loadTubes,
  removeBottomBar,
  removeFabricType,
  removeTube,
} from '../storage';
import { ThemeColors, useTheme } from '../theme/theme';
import { font, LOGO_HEIGHT, LOGO_WIDTH, MIN_TOUCH, radius, space } from '../theme/tokens';
import { BottomBar, FabricType, Tube } from '../types';
import {
  BottomBarInput,
  FabricInput,
  TubeInput,
  validateBottomBarInput,
  validateFabricInput,
  validateTubeInput,
} from '../validation';

type Category = 'tube' | 'fabric' | 'bottomBar';

const FABRIC_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'weight', label: 'Weight (oz/yd²)', numeric: true },
  { key: 'thickness', label: 'Thickness (in)', numeric: true },
];
const TUBE_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'diameter', label: 'Diameter (in)', numeric: true },
  { key: 'thickness', label: 'Thickness (in)', numeric: true },
];
const BOTTOM_BAR_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'weightLbFt', label: 'Weight (lb/ft)', numeric: true },
];

function names(items: { name: string }[]): string[] {
  return items.map((item) => item.name);
}

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { settings, ready, update } = useSettings();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const [tubes, setTubes] = useState<Tube[]>([]);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);
  const [bottomBars, setBottomBars] = useState<BottomBar[]>([]);
  const [customTubes, setCustomTubes] = useState<string[]>([]);
  const [customFabrics, setCustomFabrics] = useState<string[]>([]);
  const [customBottomBars, setCustomBottomBars] = useState<string[]>([]);

  const [selectedTube, setSelectedTube] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [selectedBottomBar, setSelectedBottomBar] = useState('');

  const [blindWidth, setBlindWidth] = useState('');
  const [blindHeight, setBlindHeight] = useState('');

  const [activeSheet, setActiveSheet] = useState<Category | null>(null);
  const [activeModal, setActiveModal] = useState<Category | null>(null);

  const refresh = useCallback(async () => {
    const [tube, fabric, bar, customTube, customFabric, customBar] = await Promise.all([
      loadTubes(),
      loadFabricTypes(),
      loadBottomBars(),
      loadCustomTubes(),
      loadCustomFabricTypes(),
      loadCustomBottomBars(),
    ]);
    setTubes(tube);
    setFabricTypes(fabric);
    setBottomBars(bar);
    setCustomTubes(names(customTube));
    setCustomFabrics(names(customFabric));
    setCustomBottomBars(names(customBar));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Restore the remembered selection once, after settings have loaded and we
  // know whether the user wants it.
  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    if (!settings.rememberSelections) return;
    loadSelection().then((remembered) => {
      setSelectedTube(remembered.tube);
      setSelectedFabric(remembered.fabric);
      setSelectedBottomBar(remembered.bottomBar);
    });
  }, [ready, settings.rememberSelections]);

  const remember = (patch: { tube?: string; fabric?: string; bottomBar?: string }) => {
    if (!settings.rememberSelections) return;
    void saveSelection({
      tube: selectedTube,
      fabric: selectedFabric,
      bottomBar: selectedBottomBar,
      ...patch,
    });
  };

  const tubeObject = useMemo(
    () => tubes.find((item) => item.name === selectedTube),
    [tubes, selectedTube]
  );
  const fabricObject = useMemo(
    () => fabricTypes.find((item) => item.name === selectedFabric),
    [fabricTypes, selectedFabric]
  );
  const bottomBarObject = useMemo(
    () => bottomBars.find((item) => item.name === selectedBottomBar),
    [bottomBars, selectedBottomBar]
  );

  // Every formula expects inches, whatever the user is typing in.
  const widthInches = toInchesText(blindWidth, settings.units);
  const heightInches = toInchesText(blindHeight, settings.units);

  const inputs: CalcInputs = {
    tube: tubeObject,
    fabric: fabricObject,
    bottomBar: bottomBarObject,
    blindWidth: widthInches,
    blindHeight: heightInches,
  };

  const { units, showSecondaryUnit } = settings;
  const diameter = lengthReading(
    rollerDiameterInch(inputs),
    rollerDiameterMm(inputs),
    units,
    settings.diameterDecimals,
    showSecondaryUnit
  );
  const weight = weightReading(
    totalWeightLb(inputs),
    totalWeightKg(inputs),
    units,
    settings.weightDecimals,
    showSecondaryUnit
  );
  const deflectionInches = tubeDeflectionInch(inputs);
  const deflection = lengthReading(
    deflectionInches,
    tubeDeflectionMm(inputs),
    units,
    settings.deflectionDecimals,
    showSecondaryUnit
  );

  const deflectionStatus: StatStatus | null =
    deflectionInches === null
      ? null
      : deflectionInches <= settings.maxDeflectionIn
        ? { label: 'Within limit', tone: 'ok' }
        : { label: 'Over limit', tone: 'over' };

  const limitLabel = lengthLabel(settings.maxDeflectionIn, units, settings.deflectionDecimals);
  const complete = deflectionInches !== null;

  const measurementError = (value: string) =>
    value.trim() !== '' && parsePositiveNumber(value) === null
      ? 'Enter a number greater than 0.'
      : undefined;

  const tubeItems: SheetItem[] = useMemo(
    () =>
      tubes.map((item) => ({
        name: item.name,
        detail: describeTube(item, units),
        custom: customTubes.includes(item.name),
      })),
    [tubes, customTubes, units]
  );
  const fabricItems: SheetItem[] = useMemo(
    () =>
      fabricTypes.map((item) => ({
        name: item.name,
        detail: describeFabric(item, units),
        custom: customFabrics.includes(item.name),
      })),
    [fabricTypes, customFabrics, units]
  );
  const bottomBarItems: SheetItem[] = useMemo(
    () =>
      bottomBars.map((item) => ({
        name: item.name,
        detail: describeBottomBar(item, units),
        custom: customBottomBars.includes(item.name),
      })),
    [bottomBars, customBottomBars, units]
  );

  const changeUnits = (next: UnitSystem) => {
    if (next === units) return;
    setBlindWidth((value) => convertDimensionText(value, units, next));
    setBlindHeight((value) => convertDimensionText(value, units, next));
    void update({ units: next });
  };

  const reset = () => {
    setSelectedTube('');
    setSelectedFabric('');
    setSelectedBottomBar('');
    setBlindWidth('');
    setBlindHeight('');
    void clearSelection();
  };

  const line = (label: string, reading: Reading) =>
    `${label}: ${reading.value} ${reading.unit}${reading.secondary ? ` (${reading.secondary})` : ''}`;

  const share = async () => {
    const summary = [
      'ZMC roller blind',
      `Tube: ${selectedTube}`,
      `Fabric: ${selectedFabric}`,
      `Bottom bar: ${selectedBottomBar}`,
      `Size: ${blindWidth} × ${blindHeight} ${unitSuffix(units)}`,
      line('Roller diameter', diameter),
      line('Total weight', weight),
      `${line('Deflection', deflection)} — ${
        deflectionStatus?.tone === 'over' ? 'over' : 'within'
      } the ${limitLabel} limit`,
    ].join('\n');

    try {
      await Share.share({ message: summary });
    } catch {
      // Dismissed, or no share target available.
    }
  };

  const handleAddFabric = async (value: FabricInput) => {
    await addFabricType(fabricFromInputs(value.name, value.weight, value.thickness));
    await refresh();
    setActiveModal(null);
  };

  const handleAddTube = async (value: TubeInput) => {
    await addTube(tubeFromInputs(value.name, value.diameter, value.thickness));
    await refresh();
    setActiveModal(null);
  };

  const handleAddBottomBar = async (value: BottomBarInput) => {
    await addBottomBar(bottomBarFromInputs(value.name, value.weightLbFt));
    await refresh();
    setActiveModal(null);
  };

  // A removed item cannot stay selected.
  const clearIfSelected = (name: string, selected: string, clearSelected: () => void) => {
    if (name === selected) clearSelected();
  };

  const handleRemoveTube = async (name: string) => {
    await removeTube(name);
    clearIfSelected(name, selectedTube, () => setSelectedTube(''));
    await refresh();
  };

  const handleRemoveFabric = async (name: string) => {
    await removeFabricType(name);
    clearIfSelected(name, selectedFabric, () => setSelectedFabric(''));
    await refresh();
  };

  const handleRemoveBottomBar = async (name: string) => {
    await removeBottomBar(name);
    clearIfSelected(name, selectedBottomBar, () => setSelectedBottomBar(''));
    await refresh();
  };

  const choose = (category: Category, name: string) => {
    if (category === 'tube') {
      setSelectedTube(name);
      remember({ tube: name });
    } else if (category === 'fabric') {
      setSelectedFabric(name);
      remember({ fabric: name });
    } else {
      setSelectedBottomBar(name);
      remember({ bottomBar: name });
    }
    setActiveSheet(null);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.appBar}>
        <Image
          source={require('../../assets/zmcLogo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="ZMC Window Covering Supplies"
        />
        <Text style={styles.appTitle} numberOfLines={2}>
          Blind Roller Calculator
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.gear}
          onPress={() => setSettingsVisible(true)}
        >
          <GearIcon color={colors.textMuted} holeColor={colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <ResultCard
            label="Roller diameter"
            reading={diameter}
            // Shares the secondary-unit line, so it costs no extra height.
            hint={complete ? null : 'Pick a tube, fabric, bar, and size.'}
            testID="roller-diameter-result"
          />
        </View>

        <View style={styles.tileRow}>
          <StatTile label="Total weight" reading={weight} testID="total-weight-result" />
          <View style={styles.tileGap} />
          <StatTile
            label="Deflection"
            reading={deflection}
            status={deflectionStatus}
            caption={`Max ${limitLabel}`}
            testID="tube-deflection-result"
          />
        </View>

        <Section>
          <Row
            label="Tube"
            value={selectedTube}
            placeholder="Choose"
            chevron
            divider
            onPress={() => setActiveSheet('tube')}
            testID="tube-select-row"
          />
          <Row
            label="Fabric"
            value={selectedFabric}
            placeholder="Choose"
            chevron
            divider
            onPress={() => setActiveSheet('fabric')}
            testID="fabric-select-row"
          />
          <Row
            label="Bottom bar"
            value={selectedBottomBar}
            placeholder="Choose"
            chevron
            onPress={() => setActiveSheet('bottomBar')}
            testID="bottom-bar-select-row"
          />
        </Section>

        <DimensionsCard
          width={blindWidth}
          height={blindHeight}
          units={units}
          widthError={measurementError(blindWidth)}
          heightError={measurementError(blindHeight)}
          onChangeWidth={setBlindWidth}
          onChangeHeight={setBlindHeight}
          onChangeUnits={changeUnits}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="zmc.ca"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => void Linking.openURL('https://www.zmc.ca')}
          >
            <Text style={styles.footerLink}>www.zmc.ca</Text>
          </TouchableOpacity>
          <Text style={styles.footerSeparator}>·</Text>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="contact@zmc.ca"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => void Linking.openURL('mailto:contact@zmc.ca')}
          >
            <Text style={styles.footerLink}>contact@zmc.ca</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Reset inputs"
          style={[styles.action, styles.secondaryAction]}
          onPress={reset}
        >
          <Text style={styles.secondaryActionLabel}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Share specs"
          accessibilityState={{ disabled: !complete }}
          disabled={!complete}
          style={[styles.action, styles.primaryAction, !complete && styles.actionDisabled]}
          onPress={() => void share()}
        >
          <Text style={styles.primaryActionLabel}>Share specs</Text>
        </TouchableOpacity>
      </View>

      <SelectSheet
        visible={activeSheet === 'tube'}
        title="Tube"
        searchPlaceholder="Search tubes"
        items={tubeItems}
        selected={selectedTube}
        onSelect={(name) => choose('tube', name)}
        onAdd={() => setActiveModal('tube')}
        onRemove={(name) => void handleRemoveTube(name)}
        onClose={() => setActiveSheet(null)}
        testID="tube-sheet"
      >
        <AddItemModal
          visible={activeModal === 'tube'}
          title="Add tube"
          fields={TUBE_FIELDS}
          onCancel={() => setActiveModal(null)}
          validate={(values) => validateTubeInput(values, names(tubes))}
          onSubmit={handleAddTube}
        />
      </SelectSheet>

      <SelectSheet
        visible={activeSheet === 'fabric'}
        title="Fabric"
        searchPlaceholder="Search fabrics"
        items={fabricItems}
        selected={selectedFabric}
        onSelect={(name) => choose('fabric', name)}
        onAdd={() => setActiveModal('fabric')}
        onRemove={(name) => void handleRemoveFabric(name)}
        onClose={() => setActiveSheet(null)}
        testID="fabric-sheet"
      >
        <AddItemModal
          visible={activeModal === 'fabric'}
          title="Add fabric type"
          fields={FABRIC_FIELDS}
          onCancel={() => setActiveModal(null)}
          validate={(values) => validateFabricInput(values, names(fabricTypes))}
          onSubmit={handleAddFabric}
        />
      </SelectSheet>

      <SelectSheet
        visible={activeSheet === 'bottomBar'}
        title="Bottom bar"
        searchPlaceholder="Search bottom bars"
        items={bottomBarItems}
        selected={selectedBottomBar}
        onSelect={(name) => choose('bottomBar', name)}
        onAdd={() => setActiveModal('bottomBar')}
        onRemove={(name) => void handleRemoveBottomBar(name)}
        onClose={() => setActiveSheet(null)}
        testID="bottom-bar-sheet"
      >
        <AddItemModal
          visible={activeModal === 'bottomBar'}
          title="Add bottom bar"
          fields={BOTTOM_BAR_FIELDS}
          onCancel={() => setActiveModal(null)}
          validate={(values) => validateBottomBarInput(values, names(bottomBars))}
          onSubmit={handleAddBottomBar}
        />
      </SelectSheet>

      <SettingsScreen
        visible={settingsVisible}
        onClose={() => {
          setSettingsVisible(false);
          // The library may have changed while settings were open.
          void refresh();
        }}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
  appTitle: {
    flex: 1,
    marginLeft: space.md,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  gear: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // flexGrow + space-between lets the cards spread to whatever height the
  // device gives them instead of stranding everything at the top of an
  // iPhone 14 Pro, while still scrolling normally on a short screen.
  scroll: {
    padding: space.md,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  hero: {
    marginBottom: space.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: space.xs,
  },
  footerLink: {
    fontSize: font.footnote,
    fontWeight: '600',
    color: colors.primary,
  },
  footerSeparator: {
    marginHorizontal: space.sm,
    fontSize: font.footnote,
    color: colors.textSubtle,
  },
  tileRow: {
    flexDirection: 'row',
    marginBottom: space.md,
  },
  tileGap: {
    width: space.sm,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    marginRight: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  secondaryActionLabel: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  primaryAction: {
    backgroundColor: colors.primary,
  },
  primaryActionLabel: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  actionDisabled: {
    opacity: 0.4,
  },
});
