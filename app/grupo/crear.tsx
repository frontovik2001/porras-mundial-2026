import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGroups } from '../../hooks/useGroup';
import { C } from '../../constants/theme';
import { MAX_GROUP_MEMBERS } from '../../constants/admin';

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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.subtitle}>Se generará un código para invitar a tus amigos</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>ℹ️ Cada grupo admite un máximo de {MAX_GROUP_MEMBERS} miembros.</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nombre del grupo"
          placeholderTextColor={C.textTertiary}
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
  subtitle: { color: C.textSecondary, fontSize: 14, lineHeight: 22 },
  notice: { backgroundColor: C.accentLight, borderRadius: 10, padding: 12 },
  noticeText: { color: C.accent, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: C.textPrimary,
    fontSize: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  error: { color: C.miss, fontSize: 13 },
  btn: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
