import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { GroupCard } from '../../components/GroupCard';
import { useGroups } from '../../hooks/useGroup';
import { C } from '../../constants/theme';

export default function GruposScreen() {
  const { groups, loading } = useGroups();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Grupos</Text>
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={() => router.push('/grupo/crear')}>
            <Text style={styles.btnText}>+ Crear</Text>
          </Pressable>
          <Pressable style={styles.btnOutline} onPress={() => router.push('/grupo/unirse')}>
            <Text style={styles.btnOutlineText}>Unirse</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>Sin grupos todavía</Text>
          <Text style={styles.emptySub}>Crea un grupo o únete con un código para competir con amigos</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={() => router.push(`/grupo/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, gap: 14 },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnOutline: { backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  btnOutlineText: { color: C.accent, fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: C.textPrimary, fontSize: 18, fontWeight: '700' },
  emptySub: { color: C.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
