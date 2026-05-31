import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SectionList, FlatList, TextInput,
  Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { Redirect } from 'expo-router';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, onSnapshot, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMatchResults } from '../hooks/useMatchResults';
import { isAdmin } from '../constants/admin';
import { PHASE_LABELS, ALL_MATCHES } from '../constants/matches';
import { FLAG } from '../constants/flags';
import { calculatePoints } from '../lib/scoring';
import { Match, UserProfile } from '../types';
import { C, SHADOW, T } from '../constants/theme';

type AdminTab = 'resultados' | 'usuarios';

export default function AdminScreen() {
  const { user } = useAuth();
  const liveMatches = useMatchResults();
  const [tab, setTab] = useState<AdminTab>('resultados');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  if (!isAdmin(user?.uid)) {
    return <Redirect href="/(tabs)" />;
  }

  useEffect(() => {
    if (tab !== 'usuarios') return;
    setLoadingUsers(true);
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
      setLoadingUsers(false);
    });
    return unsub;
  }, [tab]);

  async function banUser(u: UserProfile) {
    Alert.alert(
      'Bloquear usuario',
      `¿Bloquear a ${u.displayName}? Se eliminarán sus predicciones, se le quitará de todos los grupos y no podrá volver a entrar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear', style: 'destructive', onPress: async () => {
            try {
              const batch = writeBatch(db);

              // Borrar predicciones
              const predsSnap = await getDocs(query(collection(db, 'predictions'), where('userId', '==', u.uid)));
              predsSnap.docs.forEach((d) => batch.delete(d.ref));

              // Quitarle de grupos
              const groupsSnap = await getDocs(query(collection(db, 'groups'), where('members', 'array-contains', u.uid)));
              groupsSnap.docs.forEach((d) => batch.update(d.ref, { members: arrayRemove(u.uid) }));

              // Marcar como baneado (no borrar el doc para que no pueda crear cuenta nueva)
              batch.update(doc(db, 'users', u.uid), { banned: true });

              await batch.commit();
              Alert.alert('Hecho', `${u.displayName} bloqueado`);
            } catch {
              Alert.alert('Error', 'No se pudo bloquear el usuario');
            }
          },
        },
      ]
    );
  }

  async function unbanUser(u: UserProfile) {
    Alert.alert(
      'Desbloquear usuario',
      `¿Desbloquear a ${u.displayName}? Podrá volver a entrar en la app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desbloquear', onPress: async () => {
            try {
              await updateDoc(doc(db, 'users', u.uid), { banned: false });
              Alert.alert('Hecho', `${u.displayName} desbloqueado`);
            } catch {
              Alert.alert('Error', 'No se pudo desbloquear el usuario');
            }
          },
        },
      ]
    );
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
        <Text style={styles.bannerText}>⚙️ Panel de administrador</Text>
      </View>

      {/* Selector de pestaña */}
      <View style={styles.tabRow}>
        <Pressable style={[styles.tabBtn, tab === 'resultados' && styles.tabBtnActive]} onPress={() => setTab('resultados')}>
          <Text style={[styles.tabText, tab === 'resultados' && styles.tabTextActive]}>Resultados</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === 'usuarios' && styles.tabBtnActive]} onPress={() => setTab('usuarios')}>
          <Text style={[styles.tabText, tab === 'usuarios' && styles.tabTextActive]}>Usuarios</Text>
        </Pressable>
      </View>

      {tab === 'resultados' ? (
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
      ) : loadingUsers ? (
        <ActivityIndicator color={T.color.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users.filter((u) => {
            if (userFilter === 'active') return !(u as any).banned;
            if (userFilter === 'banned') return (u as any).banned;
            return true;
          })}
          keyExtractor={(u) => u.uid}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.userFilterRow}>
              {(['all', 'active', 'banned'] as const).map((f) => (
                <Pressable
                  key={f}
                  style={[styles.userFilterBtn, userFilter === f && styles.userFilterBtnActive]}
                  onPress={() => setUserFilter(f)}
                >
                  <Text style={[styles.userFilterText, userFilter === f && styles.userFilterTextActive]}>
                    {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Bloqueados'}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
          renderItem={({ item: u }) => (
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{u.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.displayName}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              {u.uid !== user?.uid && (
                <Pressable
                  style={(u as any).banned ? styles.bannedBtn : styles.deleteBtn}
                  onPress={() => (u as any).banned ? unbanUser(u) : banUser(u)}
                >
                  <Text style={(u as any).banned ? styles.bannedText : styles.deleteText}>
                    {(u as any).banned ? 'Bloqueado' : 'Bloquear'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

function AdminMatchRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.homeScore?.toString() ?? '');
  const [away, setAway] = useState(match.awayScore?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [penaltyWinner, setPenaltyWinner] = useState<'home' | 'away' | undefined>(match.penaltyWinner);

  // Sincronizar inputs cuando llegan los datos de Firestore
  useEffect(() => {
    if (match.homeScore !== undefined) setHome(match.homeScore.toString());
    if (match.awayScore !== undefined) setAway(match.awayScore.toString());
    setPenaltyWinner(match.penaltyWinner);
  }, [match.homeScore, match.awayScore, match.penaltyWinner]);

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
    const homeScoreInt = parseInt(home, 10);
    const awayScoreInt = parseInt(away, 10);
    try {
      await setDoc(doc(db, 'matchResults', docId), {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        homeScore: homeScoreInt,
        awayScore: awayScoreInt,
        status,
        penaltyWinner: isDraw ? (penaltyWinner ?? null) : null,
        updatedAt: serverTimestamp(),
        editedByAdmin: true,
      }, { merge: true });

      // Si el partido finaliza, recalcular puntos de todas las predicciones
      if (status === 'finished') {
        const matchObj = ALL_MATCHES.find(
          (m) => m.homeTeam === match.homeTeam && m.awayTeam === match.awayTeam
        );
        if (matchObj) {
          const predsSnap = await getDocs(
            query(collection(db, 'predictions'), where('matchId', '==', matchObj.id))
          );
          if (!predsSnap.empty) {
            const batch = writeBatch(db);
            predsSnap.docs.forEach((d) => {
              const pred = d.data();
              const points = calculatePoints(
                { homeScore: pred.homeScore, awayScore: pred.awayScore },
                { homeScore: homeScoreInt, awayScore: awayScoreInt }
              );
              batch.update(d.ref, { points });
            });
            await batch.commit();
          }
        }
      }

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
  bannerText: { color: '#92400E', fontSize: 13, fontWeight: '700' },
  tabRow: { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: T.color.accent },
  tabText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: T.color.accent },
  usersCount: { color: C.textSecondary, fontSize: 12, marginBottom: 8 },
  userFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  userFilterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  userFilterBtnActive: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  userFilterText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  userFilterTextActive: { color: '#fff' },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, padding: 12, marginVertical: 4, gap: 12, ...SHADOW },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.color.soft, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: T.color.accent, fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { color: C.textPrimary, fontSize: 14, fontWeight: '700' },
  userEmail: { color: C.textSecondary, fontSize: 12 },
  deleteBtn:   { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteText:  { color: C.miss, fontSize: 13, fontWeight: '700' },
  bannedBtn:   { backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  bannedText:  { color: C.textTertiary, fontSize: 13, fontWeight: '700' },
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
