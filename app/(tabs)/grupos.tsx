import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { GroupCard } from '../../components/GroupCard';
import { useGroups } from '../../hooks/useGroup';
import { T } from '../../constants/theme';

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
        <ActivityIndicator color={T.color.accent} style={{ marginTop: 40 }} />
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
  container: { flex: 1, backgroundColor: T.color.bg },
  header:    { paddingHorizontal: T.space.xl, paddingTop: 56, paddingBottom: T.space.lg, gap: T.space.md, backgroundColor: T.color.bg },
  title:     { color: T.color.ink, fontSize: 27, fontFamily: 'SchibstedGrotesk_800ExtraBold' },
  actions:   { flexDirection: 'row', gap: T.space.sm },
  btn:       { backgroundColor: T.color.accent, borderRadius: T.radius.chip, paddingHorizontal: T.space.lg, paddingVertical: T.space.sm },
  btnText:   { color: '#fff', fontFamily: 'HankenGrotesk_700Bold', fontSize: 14 },
  btnOutline:     { backgroundColor: T.color.surface, borderRadius: T.radius.chip, paddingHorizontal: T.space.lg, paddingVertical: T.space.sm, borderWidth: 1, borderColor: T.color.line },
  btnOutlineText: { color: T.color.accent, fontFamily: 'HankenGrotesk_700Bold', fontSize: 14 },
  list:      { paddingHorizontal: T.space.lg, paddingBottom: 32 },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: T.space.sm, paddingHorizontal: 32 },
  emptyEmoji:{ fontSize: 48 },
  emptyTitle:{ color: T.color.ink, fontSize: 18, fontFamily: 'HankenGrotesk_700Bold' },
  emptySub:  { color: T.color.ink2, fontSize: 14, fontFamily: 'HankenGrotesk_500Medium', textAlign: 'center', lineHeight: 22 },
});
