import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGroups } from '../../hooks/useGroup';
import { useAuth } from '../../contexts/AuthContext';
import { RankingItem } from '../../components/RankingItem';
import { Podium } from '../../components/Podium';
import { buildRanking } from '../../lib/scoring';
import { ALL_MATCHES } from '../../constants/matches';
import { Group, Prediction, RankingEntry, UserProfile } from '../../types';
import { C, SHADOW } from '../../constants/theme';

export default function RankingScreen() {
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const finishedMatches = useMemo(() => ALL_MATCHES.filter((m) => m.status === 'finished'), []);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) setSelectedGroup(groups[0]);
  }, [groups]);

  useEffect(() => {
    if (!selectedGroup) return;
    setLoadingRanking(true);

    async function load() {
      if (!selectedGroup) return;
      const memberDocs = await Promise.all(
        selectedGroup.members.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      const members = memberDocs
        .filter((d) => d.exists())
        .map((d) => ({ userId: d.id, displayName: (d.data() as UserProfile).displayName, photoURL: (d.data() as UserProfile).photoURL }));

      const predsSnap = await getDocs(
        query(collection(db, 'predictions'), where('userId', 'in', selectedGroup.members))
      );
      const predictions = predsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Prediction));

      setRanking(buildRanking(members, predictions, finishedMatches));
      setLoadingRanking(false);
    }

    load();
  }, [selectedGroup]);

  if (groupsLoading) {
    return <View style={styles.center}><ActivityIndicator color={C.accent} size="large" /></View>;
  }

  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Ranking</Text></View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>Únete a un grupo</Text>
          <Text style={styles.emptySub}>El ranking aparece cuando formas parte de un grupo</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>

        {groups.length > 1 && (
          <FlatList
            horizontal
            data={groups}
            keyExtractor={(g) => g.id}
            contentContainerStyle={{ gap: 8 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.chip, selectedGroup?.id === item.id && styles.chipActive]}
                onPress={() => setSelectedGroup(item)}
              >
                <Text style={[styles.chipText, selectedGroup?.id === item.id && styles.chipTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        )}

        {selectedGroup && (
          <View style={styles.codeRow}>
            <Text style={styles.codeSub}>Código del grupo: </Text>
            <Text style={styles.codeValue}>{selectedGroup.code}</Text>
          </View>
        )}
      </View>

      {loadingRanking ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : ranking.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Sin datos aún</Text>
          <Text style={styles.emptySub}>El ranking se actualiza cuando terminen los partidos</Text>
        </View>
      ) : (
        <FlatList
          data={ranking.slice(3)}
          keyExtractor={(r) => r.userId}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            ranking.length > 0 ? (
              <Podium top3={ranking.slice(0, 3)} currentUserId={user?.uid} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <RankingItem entry={item} position={index + 4} isCurrentUser={item.userId === user?.uid} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, gap: 12, backgroundColor: C.bg },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: '800' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codeSub: { color: C.textSecondary, fontSize: 13 },
  codeValue: { color: C.accent, fontSize: 13, fontWeight: '700' },
  list: { paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: C.textPrimary, fontSize: 18, fontWeight: '700' },
  emptySub: { color: C.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
