import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Group } from '../types';
import { C, SHADOW } from '../constants/theme';
import { MAX_GROUP_MEMBERS } from '../constants/admin';

interface Props {
  group: Group;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{group.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        <Text style={styles.sub}>{group.members.length}/{MAX_GROUP_MEMBERS} miembros · Código: <Text style={styles.code}>{group.code}</Text></Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    marginVertical: 5,
    gap: 14,
    ...SHADOW,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  info: { flex: 1, gap: 3 },
  name: { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  sub: { color: C.textSecondary, fontSize: 12 },
  code: { color: C.accent, fontWeight: '700' },
  arrow: { color: C.textTertiary, fontSize: 22 },
});
