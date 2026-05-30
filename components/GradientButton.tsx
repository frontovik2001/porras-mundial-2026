import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'green' | 'blue';
}

// Degradados tipo mockup: verde→azul y azul→verde
const GRADIENTS: Record<string, [string, string]> = {
  green: ['#22C55E', '#16A34A'],
  blue: ['#3B82F6', '#1D4ED8'],
};

export function GradientButton({ label, onPress, loading, disabled, style, variant = 'green' }: Props) {
  const colors = GRADIENTS[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.wrap, style, (disabled || loading) && styles.disabled]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.grad}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.label}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  grad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
