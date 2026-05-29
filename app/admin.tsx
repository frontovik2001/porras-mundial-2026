import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, TextInput,
  Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { Redirect } from 'expo-router';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMatchResults } from '../hooks/useMatchResults';
import { isAdmin } from '../constants/admin';
import { PHASE_LABELS } from '../constants/matches';
import { FLAG } from '../constants/flags';
import { Match } from '../types';
import { C, SHADOW } from '../constants/theme';

export default function AdminScreen() {
  const { user } = useAuth();
  const liveMatches = useMatchResults();

  if (!isAdmin(user?.uid)) {
    return <Redirect href="/(tabs)" />;
  }

  const sections = useMemo(() => {
    const bySection = new Map<string, Match[]>();
    for (const m of liveMatches) {
      if (m.homeTeam === 'Por definir' || m.awayTeam === 'Por definir') continue;
      const key = PHASE_LABELS[m.phase];
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(m);
    }
    return Array.from(bySection.entries()).map(([title, data]) => ({ title, data }));
  }, [liveMatches]);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          ⚙️ Modo administrador — los resultados que guardes aquí se aplican a todos los usuarios y recalculan los puntos.
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        renderItem={({ item }) => <AdminMatchRow match={item} />}
      />
    </View>
  );
}

function AdminMatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.homeScore?.toString() ?? '');
  const [away, setAway] = useState(match.awayScore?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const [penaltyWinner, setPenaltyWinner] = useState<'home' | 'away' | undefined>(match.penaltyWinner);

  const valid = /^\d{1,2}$/.test(home) && /^\d{1,2}$/.test(away);
  const isKnockout = match.phase !== 'group';
  const isDraw = valid && parseInt(home, 10) === parseInt(away, 10);
  // En eliminatoria, un empate necesita ganador de penaltis para poder finalizar
  const needsPenalty = isKnockout && isDraw;
  const canFinish = valid && (!needsPenalty || penaltyWinner != null);

  const docId = `${match.homeTeam}__${match.awayTeam}`.replace(/\s/g, '_');

  async function save(status: 'finished' | 'live') {
    if (!valid) return;
    if (status === 'finished' && needsPenalty && !penaltyWinner) {
      Alert.alert('Falta el ganador', 'Es eliminatoria y hay empate: marca quién pasó por penaltis.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'matchResults', docId), {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: parseInt(home, 10),
        awayScore: parseInt(away, 10),
        status,
        penaltyWinner: isDraw ? (penaltyWinner ?? null) : null,
        updatedAt: serverTimestamp(),
        editedByAdmin: true,
      }, { merge: true });
      Alert.alert('Guardado', `${match.homeTeam} ${home}–${away} ${match.awayTeam}${isDraw && penaltyWinner ? ` (pen. ${penaltyWinner === 'home' ? match.homeTeam : match.awayTeam})` : ''}`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el resultado');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    Alert.alert(
      'Resetear partido',
      'El partido volverá a estado "próximo" y se actualizará solo cuando se juegue. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteDoc(doc(db, 'matchResults', docId));
              setHome('');
              setAway('');
            } catch {
              Alert.alert('Error', 'No se pudo resetear');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.teams}>
        <Text style={styles.team} numberOfLines={1}>{FLAG[match.homeTeam]} {match.homeTeam}</Text>
        <Text style={styles.team} numberOfLines={1}>{FLAG[match.awayTeam]} {match.awayTeam}</Text>
      </View>

      <View style={styles.inputs}>
        <TextInput style={styles.input} value={home} onChangeText={setHome} keyboardType="number-pad" maxLength={2} placeholder="-" placeholderTextColor={C.textTertiary} selectTextOnFocus />
        <Text style={styles.dash}>–</Text>
        <TextInput style={styles.input} value={away} onChangeText={setAway} keyboardType="number-pad" maxLength={2} placeholder="-" placeholderTextColor={C.textTertiary} selectTextOnFocus />
      </View>

      {needsPenalty && (
        <View style={styles.penaltyBox}>
          <Text style={styles.penaltyLabel}>⚽ Empate — ¿quién pasó por penaltis?</Text>
          <View style={styles.penaltyRow}>
            <Pressable
              style={[styles.penaltyBtn, penaltyWinner === 'home' && styles.penaltyBtnActive]}
              onPress={() => setPenaltyWinner('home')}
            >
              <Text style={[styles.penaltyBtnText, penaltyWinner === 'home' && styles.penaltyBtnTextActive]} numberOfLines={1}>
                {match.homeTeam}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.penaltyBtn, penaltyWinner === 'away' && styles.penaltyBtnActive]}
              onPress={() => setPenaltyWinner('away')}
            >
              <Text style={[styles.penaltyBtnText, penaltyWinner === 'away' && styles.penaltyBtnTextActive]} numberOfLines={1}>
                {match.awayTeam}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.liveBtn, (!valid || saving) && styles.disabled]} onPress={() => save('live')} disabled={!valid || saving}>
          <Text style={styles.liveText}>En vivo</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.finBtn, (!canFinish || saving) && styles.disabled]} onPress={() => save('finished')} disabled={!canFinish || saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.finText}>Finalizar</Text>}
        </Pressable>
      </View>

      {match.status !== 'upcoming' && (
        <View style={styles.currentRow}>
          <Text style={styles.current}>Actual: {match.homeScore}–{match.awayScore} ({match.status === 'finished' ? 'Final' : 'En vivo'})</Text>
          <Pressable onPress={reset} disabled={saving}>
            <Text style={styles.resetText}>Resetear</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  banner: { backgroundColor: '#FEF3C7', padding: 14, borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
  bannerText: { color: '#92400E', fontSize: 12, lineHeight: 18 },
  list: { padding: 16 },
  sectionTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginVertical: 5, gap: 10, ...SHADOW },
  teams: { gap: 2 },
  team: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  inputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  input: {
    width: 56, height: 48, backgroundColor: C.bg, borderRadius: 10,
    borderWidth: 1, borderColor: C.border, color: C.textPrimary,
    fontSize: 22, fontWeight: '700', textAlign: 'center',
  },
  dash: { color: C.textTertiary, fontSize: 18 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderRadius: 10, height: 42, alignItems: 'center', justifyContent: 'center' },
  liveBtn: { backgroundColor: '#FEE2E2' },
  liveText: { color: C.miss, fontWeight: '700', fontSize: 14 },
  finBtn: { backgroundColor: C.accent },
  finText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.4 },
  penaltyBox: { backgroundColor: C.bg, borderRadius: 10, padding: 10, gap: 8 },
  penaltyLabel: { color: C.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  penaltyRow: { flexDirection: 'row', gap: 8 },
  penaltyBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  penaltyBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  penaltyBtnText: { color: C.textPrimary, fontSize: 12, fontWeight: '600' },
  penaltyBtnTextActive: { color: '#fff' },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  current: { color: C.textSecondary, fontSize: 12 },
  resetText: { color: C.miss, fontSize: 12, fontWeight: '700' },
});
