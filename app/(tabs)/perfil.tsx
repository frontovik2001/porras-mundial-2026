import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert,
  TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { usePredictions } from '../../hooks/usePredictions';
import { ALL_MATCHES } from '../../constants/matches';
import { C, SHADOW } from '../../constants/theme';

export default function PerfilScreen() {
  const { profile, logOut, updateDisplayName } = useAuth();
  const { predictions } = usePredictions();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const finishedMatches = ALL_MATCHES.filter((m) => m.status === 'finished');
  const myPredictionsOnFinished = predictions.filter((p) =>
    finishedMatches.some((m) => m.id === p.matchId)
  );
  const totalPoints = myPredictionsOnFinished.reduce((acc, p) => acc + (p.points ?? 0), 0);
  const exactHits = myPredictionsOnFinished.filter((p) => p.points === 5).length;

  async function handleSaveName() {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(newName.trim());
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el nombre');
    } finally {
      setSavingName(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await logOut(); router.replace('/(auth)/login'); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      {/* Avatar y nombre */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.displayName ?? '?').charAt(0).toUpperCase()}</Text>
        </View>

        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              maxLength={30}
              selectTextOnFocus
            />
            <Pressable style={styles.saveNameBtn} onPress={handleSaveName} disabled={savingName}>
              {savingName
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveNameText}>✓</Text>}
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => { setEditingName(false); setNewName(profile?.displayName ?? ''); }}>
              <Text style={styles.cancelText}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.nameRow} onPress={() => setEditingName(true)}>
            <Text style={styles.name}>{profile?.displayName}</Text>
            <Text style={styles.editIcon}>✏️</Text>
          </Pressable>
        )}

        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatBox label="Puntos" value={totalPoints.toString()} color={C.accent} />
        <StatBox label="Predicciones" value={predictions.length.toString()} color={C.textPrimary} />
        <StatBox label="Exactas" value={exactHits.toString()} color={C.exact} />
      </View>

      {/* Sistema de puntuación */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Sistema de puntuación</Text>
        <View style={styles.infoRow}><Text style={[styles.infoPts, { color: C.exact }]}>5 pts</Text><Text style={styles.infoDesc}>Resultado exacto</Text></View>
        <View style={styles.infoRow}><Text style={[styles.infoPts, { color: C.result }]}>2 pts</Text><Text style={styles.infoDesc}>Resultado correcto (G/E/P)</Text></View>
        <View style={styles.infoRow}><Text style={[styles.infoPts, { color: C.miss }]}>0 pts</Text><Text style={styles.infoDesc}>Fallo</Text></View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: '800' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: C.textPrimary, fontSize: 22, fontWeight: '700' },
  editIcon: { fontSize: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    borderWidth: 1, borderColor: C.accent, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    fontSize: 18, fontWeight: '700', color: C.textPrimary,
    minWidth: 160,
  },
  saveNameBtn: { backgroundColor: C.accent, borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  saveNameText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cancelBtn: { backgroundColor: C.bg, borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.textSecondary, fontSize: 16 },
  email: { color: C.textSecondary, fontSize: 14 },
  stats: { flexDirection: 'row', marginHorizontal: 16, gap: 10 },
  statBox: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4, ...SHADOW },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: C.textSecondary, fontSize: 12, textAlign: 'center' },
  infoBox: { margin: 16, backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 10, ...SHADOW },
  infoLabel: { color: C.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoPts: { fontSize: 15, fontWeight: '800', width: 44 },
  infoDesc: { color: C.textPrimary, fontSize: 14 },
  logoutBtn: { margin: 16, marginTop: 'auto', backgroundColor: C.surface, borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: C.miss, fontSize: 16, fontWeight: '700' },
});
