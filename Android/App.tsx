// Providers and the app frame. The screens themselves live in src/screens.

import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import CalculatorScreen from './src/screens/CalculatorScreen';
import { SettingsProvider } from './src/settings/settings';
import { ThemeProvider, useTheme } from './src/theme/theme';

function Frame() {
  const { colors, resolvedTheme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      testID="app-root"
    >
      <ExpoStatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <CalculatorScreen />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <SettingsProvider>
          <Frame />
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
