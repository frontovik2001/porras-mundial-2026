import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { OfflineBanner } from '../components/OfflineBanner';
import { View, StyleSheet } from 'react-native';
import { C } from '../constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="partido/[id]" options={{ headerShown: true, title: 'Predicción', headerStyle: { backgroundColor: C.surface }, headerTintColor: C.textPrimary, headerShadowVisible: false }} />
          <Stack.Screen name="grupo/crear" options={{ headerShown: true, title: 'Crear Grupo', headerStyle: { backgroundColor: C.surface }, headerTintColor: C.textPrimary, headerShadowVisible: false }} />
          <Stack.Screen name="grupo/unirse" options={{ headerShown: true, title: 'Unirse a Grupo', headerStyle: { backgroundColor: C.surface }, headerTintColor: C.textPrimary, headerShadowVisible: false }} />
          <Stack.Screen name="grupo/[id]" options={{ headerShown: true, title: 'Grupo', headerStyle: { backgroundColor: C.surface }, headerTintColor: C.textPrimary, headerShadowVisible: false }} />
          <Stack.Screen name="admin" options={{ headerShown: true, title: 'Administrador', headerStyle: { backgroundColor: C.surface }, headerTintColor: C.textPrimary, headerShadowVisible: false }} />
        </Stack>
        <StatusBar style="dark" />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
});
