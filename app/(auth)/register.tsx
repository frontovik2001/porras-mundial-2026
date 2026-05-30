import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useGroups } from '../../hooks/useGroup';
import { C } from '../../constants/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { joinGroup } = useGroups();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleRegister() {
    if (!displayName.trim() || !email || !password) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (groupCode && groupCode.trim().length !== 6) {
      setError('El código de grupo debe tener 6 caracteres (o déjalo vacío)');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signUp(email, password, displayName.trim());

      // Si metió un código, intentamos unirlo al grupo.
      // Si falla (código erróneo, grupo lleno), la cuenta ya está creada:
      // entra igual y avisamos para que se una luego desde Grupos.
      if (groupCode.trim()) {
        try {
          await joinGroup(groupCode.trim());
        } catch (joinErr) {
          const msg = joinErr instanceof Error ? joinErr.message : 'No se pudo unir al grupo';
          setNotice(`Cuenta creada, pero ${msg.toLowerCase()}. Únete desde la pestaña Grupos.`);
        }
      }

      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(mapFirebaseError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.sub}>Únete y predice el Mundial 2026</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor={C.textTertiary} value={displayName} onChangeText={setDisplayName} autoCapitalize="words" autoComplete="name" />
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={C.textTertiary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <TextInput style={styles.input} placeholder="Contraseña (mín. 6 caracteres)" placeholderTextColor={C.textTertiary} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />

          <View style={styles.codeWrap}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="Código de grupo"
              placeholderTextColor={C.textTertiary}
              value={groupCode}
              onChangeText={(t) => setGroupCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
            />
            <Text style={styles.optional}>opcional</Text>
          </View>
          <Text style={styles.codeHint}>Si tienes un código, te unimos a ese grupo al registrarte.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Crear cuenta</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Ya tengo cuenta</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapFirebaseError(e: unknown): string {
  const code = (e as { code?: string }).code;
  if (code === 'auth/email-already-in-use') return 'Ya existe una cuenta con este correo';
  if (code === 'auth/invalid-email') return 'Correo no válido';
  if (code === 'auth/weak-password') return 'Contraseña muy débil';
  return 'Error al crear la cuenta';
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 32 },
  header: { alignItems: 'center', gap: 8 },
  title: { color: C.textPrimary, fontSize: 26, fontWeight: '800' },
  sub: { color: C.textSecondary, fontSize: 15 },
  form: { gap: 12 },
  input: {
    backgroundColor: C.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: C.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  codeWrap: { position: 'relative', justifyContent: 'center' },
  codeInput: { letterSpacing: 4, fontWeight: '700' },
  optional: { position: 'absolute', right: 16, color: C.textTertiary, fontSize: 12, fontStyle: 'italic' },
  codeHint: { color: C.textTertiary, fontSize: 12, marginTop: -4 },
  error: { color: C.miss, fontSize: 13, textAlign: 'center' },
  notice: { color: C.result, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  btn: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { alignItems: 'center' },
  backText: { color: C.accent, fontSize: 15, fontWeight: '600' },
});
