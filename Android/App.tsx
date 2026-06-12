// Main screen — port of ContentView.swift.
// Wires the three pickers + two inputs to the calculation functions and the
// three result readouts, plus the "add new item" modals.

import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Linking,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { FabricType, Tube, BottomBar } from './src/types';
import {
  loadFabricTypes,
  loadTubes,
  loadBottomBars,
  addFabricType,
  addTube,
  addBottomBar,
} from './src/storage';
import {
  CalcInputs,
  totalWeightKg,
  totalWeightLb,
  rollerDiameterMm,
  rollerDiameterInch,
  tubeDeflectionMm,
  tubeDeflectionInch,
  MAX_DEFLECTION_IN,
  MAX_DEFLECTION_MM,
} from './src/calculations';
import ScrollablePicker from './src/components/ScrollablePicker';
import InputField from './src/components/InputField';
import AddItemModal, { FieldSpec } from './src/components/AddItemModal';

type ModalKind = 'fabric' | 'tube' | 'bottomBar' | null;

export default function App() {
  const [tubes, setTubes] = useState<Tube[]>([]);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);
  const [bottomBars, setBottomBars] = useState<BottomBar[]>([]);

  const [selectedTube, setSelectedTube] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [selectedBottomBar, setSelectedBottomBar] = useState('');

  const [blindWidth, setBlindWidth] = useState('');
  const [blindHeight, setBlindHeight] = useState('');

  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  // Load data on mount (mirrors DataManager.init -> loadData).
  useEffect(() => {
    (async () => {
      setTubes(await loadTubes());
      setFabricTypes(await loadFabricTypes());
      setBottomBars(await loadBottomBars());
    })();
  }, []);

  const tubeObject = useMemo(
    () => tubes.find((t) => t.name === selectedTube),
    [tubes, selectedTube]
  );
  const fabricObject = useMemo(
    () => fabricTypes.find((f) => f.name === selectedFabric),
    [fabricTypes, selectedFabric]
  );
  const bottomBarObject = useMemo(
    () => bottomBars.find((b) => b.name === selectedBottomBar),
    [bottomBars, selectedBottomBar]
  );

  const inputs: CalcInputs = {
    tube: tubeObject,
    fabric: fabricObject,
    bottomBar: bottomBarObject,
    blindWidth,
    blindHeight,
  };

  const weightKg = totalWeightKg(inputs);
  const weightLb = totalWeightLb(inputs);
  const diameterMm = rollerDiameterMm(inputs);
  const diameterIn = rollerDiameterInch(inputs);
  const deflectionMm = tubeDeflectionMm(inputs);
  const deflectionIn = tubeDeflectionInch(inputs);

  // Field specs for the three "add" modals, matching the iOS forms.
  const fabricFields: FieldSpec[] = [
    { key: 'name', label: 'Name', numeric: false },
    { key: 'weight', label: 'Weight (g/m²)', numeric: true },
    { key: 'thickness', label: 'Thickness (mm)', numeric: true },
  ];
  const tubeFields: FieldSpec[] = [
    { key: 'name', label: 'Name', numeric: false },
    { key: 'diameter', label: 'Diameter (mm)', numeric: true },
    { key: 'thickness', label: 'Thickness (mm)', numeric: true },
    { key: 'moment', label: 'Moment (cm^4)', numeric: true },
    { key: 'elasticity', label: 'Elasticity (kg/cm²)', numeric: true },
    { key: 'weight', label: 'Weight (kg/m)', numeric: true },
  ];
  const bottomBarFields: FieldSpec[] = [
    { key: 'name', label: 'Name', numeric: false },
    { key: 'weightGM', label: 'Weight (gm/m)', numeric: true },
    { key: 'weightLbFt', label: 'Weight (lb/ft)', numeric: true },
  ];

  const handleAddFabric = async (v: Record<string, string>) => {
    const updated = await addFabricType({
      name: v.name,
      weight: Number(v.weight),
      thickness: Number(v.thickness),
    });
    setFabricTypes(updated);
    setActiveModal(null);
  };

  const handleAddTube = async (v: Record<string, string>) => {
    const updated = await addTube({
      name: v.name,
      diameter: Number(v.diameter),
      thickness: Number(v.thickness),
      moment: Number(v.moment),
      elasticity: Number(v.elasticity),
      weight: Number(v.weight),
    });
    setTubes(updated);
    setActiveModal(null);
  };

  const handleAddBottomBar = async (v: Record<string, string>) => {
    const updated = await addBottomBar({
      name: v.name,
      weightGM: Number(v.weightGM),
      weightLbFt: Number(v.weightLbFt),
    });
    setBottomBars(updated);
    setActiveModal(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={require('./assets/zmcLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heading}>
            Blind Roller Diameter & Weight Calculator
          </Text>
        </View>

        <ScrollablePicker
          title="Select Tube"
          options={tubes.map((t) => t.name)}
          selection={selectedTube}
          onSelect={setSelectedTube}
          onAdd={() => setActiveModal('tube')}
        />
        <ScrollablePicker
          title="Select Fabric Type"
          options={fabricTypes.map((f) => f.name)}
          selection={selectedFabric}
          onSelect={setSelectedFabric}
          onAdd={() => setActiveModal('fabric')}
        />
        <ScrollablePicker
          title="Select Bottom Bar"
          options={bottomBars.map((b) => b.name)}
          selection={selectedBottomBar}
          onSelect={setSelectedBottomBar}
          onAdd={() => setActiveModal('bottomBar')}
        />

        <View style={styles.inputRow}>
          <InputField
            title="Blind Width (in)"
            value={blindWidth}
            onChangeText={setBlindWidth}
          />
          <View style={{ width: 10 }} />
          <InputField
            title="Blind Height (in)"
            value={blindHeight}
            onChangeText={setBlindHeight}
          />
        </View>

        <View style={styles.results}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Weight</Text>
            <Text style={styles.resultValue}>
              {weightLb.toFixed(3)} lb{' '}
              <Text style={styles.resultSub}>({weightKg.toFixed(3)} kg)</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Roller Diameter</Text>
            <Text style={styles.resultValue}>
              {diameterIn.toFixed(3)} in{' '}
              <Text style={styles.resultSub}>({diameterMm.toFixed(3)} mm)</Text>
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tube Deflection</Text>
            <Text style={styles.resultValue}>
              {deflectionIn.toFixed(3)} in{' '}
              <Text style={styles.resultSub}>({deflectionMm.toFixed(3)} mm)</Text>
            </Text>
          </View>

          <Text style={styles.note}>
            [ <Text style={styles.noteRed}>Deflection</Text> should be less than{' '}
            <Text style={styles.noteRed}>
              {MAX_DEFLECTION_IN} in ({MAX_DEFLECTION_MM} mm)
            </Text> ]
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => Linking.openURL('http://www.zmc.ca')}>
            <Text style={styles.link}>www.zmc.ca</Text>
          </TouchableOpacity>
          <Text style={styles.contact}>contact@zmc.ca</Text>
        </View>
      </ScrollView>

      <AddItemModal
        visible={activeModal === 'fabric'}
        title="Add Fabric Type"
        fields={fabricFields}
        onCancel={() => setActiveModal(null)}
        onSubmit={handleAddFabric}
      />
      <AddItemModal
        visible={activeModal === 'tube'}
        title="Add Tube"
        fields={tubeFields}
        onCancel={() => setActiveModal(null)}
        onSubmit={handleAddTube}
      />
      <AddItemModal
        visible={activeModal === 'bottomBar'}
        title="Add Bottom Bar"
        fields={bottomBarFields}
        onCancel={() => setActiveModal(null)}
        onSubmit={handleAddBottomBar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#eef2f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scroll: {
    padding: 12,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 130,
    height: 80,
    marginRight: 10,
  },
  heading: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  results: {
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0d5da',
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#55606a',
  },
  resultValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1d21',
    textAlign: 'right',
  },
  resultSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8a939c',
  },
  divider: {
    height: 1,
    backgroundColor: '#eceff2',
  },
  note: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  noteRed: {
    color: '#d11',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  link: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 30,
  },
  contact: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 30,
  },
});
