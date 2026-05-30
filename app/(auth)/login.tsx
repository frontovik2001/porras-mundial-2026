import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      handleGoogleLogin(id_token);
    }
  }, [googleResponse]);

  async function handleGoogleLogin(idToken: string) {
    setError(''); setLoading(true);
    try {
      await signInWithGoogle(idToken);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error con Google');
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setError(''); setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setError(mapFirebaseError(e));
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>⚽</Text>
          <Text style={styles.title}>Porras Mundial 2026</Text>
          <Text style={styles.sub}>Predice. Compite. Gana.</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor={C.textTertiary} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor={C.textTertiary} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>o</Text>
            <View style={styles.line} />
          </View>

          <Pressable style={styles.googleBtn} onPress={() => promptGoogleAsync()} disabled={loading}>
            <Text style={styles.googleText}>Continuar con Google</Text>
          </Pressable>
        </View>

        <Link href="/(auth)/register" asChild>
          <Pressable style={styles.registerLink}>
            <Text style={styles.registerText}>¿No tienes cuenta? <Text style={styles.registerCta}>Regístrate</Text></Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function mapFirebaseError(e: unknown): string {
  const code = (e as { code?: string }).code;
  if (code === 'auth/invalid-credential') return 'Correo o contraseña incorrectos';
  if (code === 'auth/user-not-found') return 'No existe una cuenta con este correo';
  if (code === 'auth/wrong-password') return 'Contraseña incorrecta';
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Intenta más tarde';
  return 'Error al iniciar sesión';
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 36 },
  header: { alignItems: 'center', gap: 8 },
  emoji: { fontSize: 60 },
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
  error: { color: C.miss, fontSize: 13, textAlign: 'center' },
  btn: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  or: { color: C.textTertiary, fontSize: 13 },
  googleBtn: { backgroundColor: C.surface, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  googleText: { color: C.textPrimary, fontSize: 16, fontWeight: '600' },
  registerLink: { alignItems: 'center' },
  registerText: { color: C.textSecondary, fontSize: 14 },
  registerCta: { color: C.accent, fontWeight: '700' },
});
