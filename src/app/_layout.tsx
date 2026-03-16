import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '.';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* <AnimatedSplashOverlay /> */}
      <SafeAreaView style={{ flex: 1 }}>
        <HomeScreen />

      </SafeAreaView>
    </ThemeProvider>
  );
}
