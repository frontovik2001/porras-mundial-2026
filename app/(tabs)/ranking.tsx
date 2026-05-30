import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGroups } from '../../hooks/useGroup';
import { useAuth } from '../../contexts/AuthContext';
import { RankingItem } from '../../components/RankingItem';
import { Podium } from '../../components/Podium';
import { buildRanking } from '../../lib/scoring';
import { Group, Prediction, RankingEntry, UserProfile } from '../../types';
import { T } from '../../constants/theme';
import { useMatchResults } from '../../hooks/useMatchResults';

export default function RankingScreen() {
  const { user } = useAuth();
  const { groups, loading: groupsLoading } = useGroups();
  const liveMatches = useMatchResults();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [members, setMembers] = useState<{ userId: string; displayName: string; photoURL: string | null }[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  const finishedMatches = useMemo(() => liveMatches.filter((m) => m.status === 'finished'), [liveMatches]);

  // Ranking calculado en tiempo real cada vez que cambian partidos o predicciones
  const ranking = useMemo(
    () => buildRanking(members, predictions, finishedMatches),
    [members, predictions, finishedMatches]
  );

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) setSelectedGroup(groups[0]);
  }, [groups]);

  // Carga de datos de Firestore: solo cuando cambia el grupo seleccionado
  useFocusEffect(useCallback(() => {
    if (!selectedGroup) return;
    setLoadingRanking(true);
    async function load() {
      if (!selectedGroup) return;
      const memberDocs = await Promise.all(
        selectedGroup.members.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      setMembers(
        memberDocs
          .filter((d) => d.exists())
          .map((d) => ({ userId: d.id, displayName: (d.data() as UserProfile).displayName, photoURL: (d.data() as UserProfile).photoURL }))
      );
      const predsSnap = await getDocs(
        query(collection(db, 'predictions'), where('userId', 'in', selectedGroup.members))
      );
      setPredictions(predsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Prediction)));
      setLoadingRanking(false);
    }
    load();
  }, [selectedGroup]));

  if (groupsLoading) {
    return <View style={styles.center}><ActivityIndicator color={T.color.accent} size="large" /></View>;
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
            contentContainerStyle={{ gap: T.space.sm }}
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
            <Text style={styles.codeSub}>Código: </Text>
            <Text style={styles.codeValue}>{selectedGroup.code}</Text>
          </View>
        )}
      </View>

      {loadingRanking ? (
        <ActivityIndicator color={T.color.accent} style={{ marginTop: 40 }} />
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
            ranking.length > 0
              ? <Podium top3={ranking.slice(0, 3)} currentUserId={user?.uid} />
              : null
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
  container: { flex: 1, backgroundColor: T.color.bg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.color.bg },
  header:    { paddingHorizontal: T.space.xl, paddingTop: 56, paddingBottom: T.space.lg, gap: T.space.sm, backgroundColor: T.color.bg },
  title:     { color: T.color.ink, fontSize: 27, fontFamily: 'SchibstedGrotesk_800ExtraBold' },
  chip:       { paddingHorizontal: T.space.md, paddingVertical: T.space.xs, borderRadius: T.radius.chip, borderWidth: 1, borderColor: T.color.line },
  chipActive: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  chipText:       { color: T.color.ink2, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },
  chipTextActive: { color: '#fff' },
  codeRow:   { flexDirection: 'row', alignItems: 'center' },
  codeSub:   { color: T.color.ink3, fontSize: 13, fontFamily: 'HankenGrotesk_500Medium' },
  codeValue: { color: T.color.accent, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },
  list:      { paddingBottom: 32 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: T.space.sm, paddingHorizontal: 32 },
  emptyEmoji:{ fontSize: 48 },
  emptyTitle:{ color: T.color.ink, fontSize: 18, fontFamily: 'HankenGrotesk_700Bold' },
  emptySub:  { color: T.color.ink2, fontSize: 14, fontFamily: 'HankenGrotesk_500Medium', textAlign: 'center', lineHeight: 22 },
});
