import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGroups } from '../../hooks/useGroup';

export default function CrearGrupoScreen() {
  const { createGroup } = useGroups();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) { setError('Ponle un nombre al grupo'); return; }
    setError('');
    setLoading(true);
    try {
      const group = await createGroup(name.trim());
      router.replace(`/grupo/${group.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear grupo');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0f172a' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.subtitle}>Se generará un código para invitar a tus amigos</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre del grupo"
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={40}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Crear grupo</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, paddingTop: 24 },
  subtitle: { color: '#64748b', fontSize: 14, lineHeight: 22 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#f1f5f9',
    fontSize: 18,
  },
  error: { color: '#ef4444', fontSize: 13 },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
