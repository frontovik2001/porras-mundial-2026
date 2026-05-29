import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Share,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { RankingItem } from '../../components/RankingItem';
import { buildRanking } from '../../lib/scoring';
import { ALL_MATCHES } from '../../constants/matches';
import { Group, Prediction, RankingEntry, UserProfile } from '../../types';
import { C, SHADOW } from '../../constants/theme';
import { MAX_GROUP_MEMBERS } from '../../constants/admin';

export default function GrupoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const finishedMatches = useMemo(() => ALL_MATCHES.filter((m) => m.status === 'finished'), []);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const groupSnap = await getDoc(doc(db, 'groups', id!));
      if (!groupSnap.exists()) { setLoading(false); return; }

      const groupData = { id: groupSnap.id, ...groupSnap.data() } as Group;
      setGroup(groupData);

      const memberDocs = await Promise.all(
        groupData.members.map((uid) => getDoc(doc(db, 'users', uid)))
      );
      const members = memberDocs
        .filter((d) => d.exists())
        .map((d) => ({ userId: d.id, displayName: (d.data() as UserProfile).displayName, photoURL: (d.data() as UserProfile).photoURL }));

      const predsSnap = await getDocs(
        query(collection(db, 'predictions'), where('userId', 'in', groupData.members))
      );
      const predictions = predsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Prediction));

      setRanking(buildRanking(members, predictions, finishedMatches));
      setLoading(false);
    }

    load();
  }, [id]);

  async function shareCode() {
    if (!group) return;
    await Share.share({
      message: `¡Únete a mi grupo "${group.name}" en Porras Mundial 2026! Código: ${group.code}`,
    });
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={C.accent} /></View>;
  }

  if (!group) {
    return <View style={styles.center}><Text style={styles.error}>Grupo no encontrado</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.members.length}/{MAX_GROUP_MEMBERS} miembros{group.members.length >= MAX_GROUP_MEMBERS ? ' · COMPLETO' : ''}</Text>
        <Pressable style={styles.shareBtn} onPress={shareCode}>
          <Text style={styles.shareBtnText}>Compartir · {group.code}</Text>
        </Pressable>
      </View>

      {finishedMatches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>El ranking se actualiza cuando terminen los partidos</Text>
        </View>
      ) : (
        <FlatList
          data={ranking}
          keyExtractor={(r) => r.userId}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Clasificación</Text>}
          renderItem={({ item, index }) => (
            <RankingItem entry={item} position={index + 1} isCurrentUser={item.userId === user?.uid} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  error: { color: C.miss, fontSize: 16 },
  headerCard: {
    margin: 16,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    gap: 6,
    ...SHADOW,
  },
  groupName: { color: C.textPrimary, fontSize: 22, fontWeight: '800' },
  memberCount: { color: C.textSecondary, fontSize: 14 },
  shareBtn: {
    backgroundColor: C.accentLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  shareBtnText: { color: C.accent, fontSize: 14, fontWeight: '700' },
  list: { paddingBottom: 32 },
  sectionTitle: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: C.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 24 },
});
