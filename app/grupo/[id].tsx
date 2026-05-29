import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { RankingItem } from '../../components/RankingItem';
import { buildRanking } from '../../lib/scoring';
import { ALL_MATCHES } from '../../constants/matches';
import { Group, Prediction, RankingEntry, UserProfile } from '../../types';

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
    return <ActivityIndicator color="#6366f1" style={{ flex: 1, marginTop: 40 }} />;
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Grupo no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.members.length} participantes</Text>
        <Pressable style={styles.shareBtn} onPress={shareCode}>
          <Text style={styles.shareBtnText}>Compartir código: {group.code}</Text>
        </Pressable>
      </View>

      {finishedMatches.length === 0 ? (
        <View style={styles.empty}>
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ef4444', fontSize: 16 },
  header: {
    padding: 16,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  groupName: { color: '#f1f5f9', fontSize: 22, fontWeight: '800' },
  memberCount: { color: '#64748b', fontSize: 14 },
  shareBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  shareBtnText: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  list: { paddingBottom: 32 },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#64748b', fontSize: 15, textAlign: 'center', lineHeight: 24 },
});
