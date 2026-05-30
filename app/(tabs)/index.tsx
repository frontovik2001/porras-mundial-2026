import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, Pressable,
  Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MatchCard } from '../../components/MatchCard';
import { usePredictions } from '../../hooks/usePredictions';
import { useUserPredictions } from '../../hooks/useUserPredictions';
import { useMatchResults } from '../../hooks/useMatchResults';
import { useGroups } from '../../hooks/useGroup';
import { useAuth } from '../../contexts/AuthContext';
import { PHASE_LABELS, GROUPS } from '../../constants/matches';
import { Match, UserProfile } from '../../types';
import { T } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type PhaseFilter = 'group' | 'knockout' | 'all';

const FILTERS: { key: PhaseFilter; label: string }[] = [
  { key: 'group',    label: 'Grupos' },
  { key: 'knockout', label: 'Eliminatoria' },
  { key: 'all',      label: 'Todos' },
];

interface Member { uid: string; displayName: string }

export default function PrediccionesScreen() {
  const { user } = useAuth();
  const { getPrediction, savePrediction } = usePredictions();
  const liveMatches = useMatchResults();
  const { groups } = useGroups();
  const [filter, setFilter] = useState<PhaseFilter>('group');

  // Selector de usuario
  const [members, setMembers]           = useState<Member[]>([]);
  const [selectedUid, setSelectedUid]   = useState<string | null>(null); // null = yo
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const { getPrediction: getOtherPred, loading: loadingOther } = useUserPredictions(selectedUid);

  // Cargar miembros únicos de todos los grupos
  useEffect(() => {
    if (!groups.length || !user) return;
    const uids = [...new Set(groups.flatMap((g) => g.members).filter((uid) => uid !== user.uid))];
    if (!uids.length) return;
    setLoadingMembers(true);
    Promise.all(uids.map((uid) => getDoc(doc(db, 'users', uid)))).then((docs) => {
      setMembers(
        docs
          .filter((d) => d.exists())
          .map((d) => ({ uid: d.id, displayName: (d.data() as UserProfile).displayName }))
      );
      setLoadingMembers(false);
    });
  }, [groups, user]);

  const viewingOther  = selectedUid !== null;
  const selectedName  = members.find((m) => m.uid === selectedUid)?.displayName ?? 'Yo';
  const activePred    = viewingOther ? getOtherPred : getPrediction;

  const sections = useMemo(() => {
    const filtered = liveMatches.filter((m) => {
      if (filter === 'group')    return m.phase === 'group';
      if (filter === 'knockout') return m.phase !== 'group';
      return true;
    });
    const bySection = new Map<string, Match[]>();
    for (const match of filtered) {
      const key = match.phase === 'group' && match.group
        ? `Grupo ${match.group}`
        : PHASE_LABELS[match.phase];
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(match);
    }
    return Array.from(bySection.entries()).map(([title, data]) => ({ title, data }));
  }, [filter, liveMatches]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Predicciones</Text>

        {/* Selector de usuario */}
        {members.length > 0 && (
          <Pressable style={styles.userSelector} onPress={() => setModalVisible(true)}>
            <View style={styles.userSelectorLeft}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {viewingOther ? selectedName.charAt(0).toUpperCase() : (user?.displayName ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userSelectorLabel}>
                {viewingOther ? selectedName : 'Mis predicciones'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={T.color.ink3} />
          </Pressable>
        )}

        {/* Filtros de fase */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loadingOther ? (
        <ActivityIndicator color={T.color.accent} style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
              {filter === 'group' && (
                <Text style={styles.sectionSub}>
                  {GROUPS[title.replace('Grupo ', '')]?.teams.join(' · ')}
                </Text>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              prediction={activePred(item.id)}
              onSave={viewingOther ? async () => {} : savePrediction}
              readOnly={viewingOther}
            />
          )}
        />
      )}

      {/* Modal selector */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ver predicciones de</Text>

            {/* Opción: yo */}
            <Pressable
              style={[styles.memberRow, !viewingOther && styles.memberRowActive]}
              onPress={() => { setSelectedUid(null); setModalVisible(false); }}
            >
              <View style={[styles.memberAvatar, { backgroundColor: T.color.accent }]}>
                <Text style={styles.memberAvatarText}>{(user?.displayName ?? '?').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.memberName}>Mis predicciones</Text>
              {!viewingOther && <Ionicons name="checkmark" size={18} color={T.color.accent} />}
            </Pressable>

            {loadingMembers ? (
              <ActivityIndicator color={T.color.accent} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={members}
                keyExtractor={(m) => m.uid}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.memberRow, selectedUid === item.uid && styles.memberRowActive]}
                    onPress={() => { setSelectedUid(item.uid); setModalVisible(false); }}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.memberName}>{item.displayName}</Text>
                    {selectedUid === item.uid && <Ionicons name="checkmark" size={18} color={T.color.accent} />}
                  </Pressable>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    paddingHorizontal: T.space.xl,
    paddingTop: 56,
    paddingBottom: T.space.lg,
    gap: T.space.md,
    backgroundColor: T.color.bg,
  },
  title: { color: T.color.ink, fontSize: 27, fontFamily: 'SchibstedGrotesk_800ExtraBold' },

  // Selector usuario
  userSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.color.surface,
    borderRadius: T.radius.chip,
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.sm,
    borderWidth: 1,
    borderColor: T.color.line,
    alignSelf: 'flex-start',
    gap: T.space.sm,
  },
  userSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: T.space.sm },
  avatarSmall:      { width: 24, height: 24, borderRadius: 12, backgroundColor: T.color.soft, alignItems: 'center', justifyContent: 'center' },
  avatarSmallText:  { color: T.color.accent, fontSize: 12, fontFamily: 'SchibstedGrotesk_700Bold' },
  userSelectorLabel:{ color: T.color.ink, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },

  // Filtros
  filters: { flexDirection: 'row', gap: T.space.sm },
  chip:       { paddingHorizontal: T.space.md, paddingVertical: T.space.xs, borderRadius: T.radius.chip, borderWidth: 1, borderColor: T.color.line },
  chipActive: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  chipText:       { color: T.color.ink2, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },
  chipTextActive: { color: '#fff' },

  list: { paddingHorizontal: T.space.lg, paddingBottom: 32 },
  sectionHeader: { marginTop: T.space.xl, marginBottom: T.space.sm, gap: 2 },
  sectionTitle:  { color: T.color.ink, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' },
  sectionSub:    { color: T.color.ink3, fontSize: 11, fontFamily: 'HankenGrotesk_400Regular' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: T.color.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: T.space.xl, paddingTop: T.space.md, paddingBottom: 40 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: T.color.line, alignSelf: 'center', marginBottom: T.space.lg },
  modalTitle:   { color: T.color.ink, fontSize: 17, fontFamily: 'SchibstedGrotesk_700Bold', marginBottom: T.space.sm },
  memberRow:    { flexDirection: 'row', alignItems: 'center', gap: T.space.md, paddingVertical: T.space.sm, borderRadius: 12 },
  memberRowActive: { },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.color.line, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { color: T.color.ink, fontSize: 17, fontFamily: 'SchibstedGrotesk_700Bold' },
  memberName:   { flex: 1, color: T.color.ink, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' },
});
