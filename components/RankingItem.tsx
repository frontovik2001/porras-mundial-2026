import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RankingEntry } from '../types';
import { C } from '../constants/theme';

interface Props {
  entry: RankingEntry;
  position: number;
  isCurrentUser: boolean;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function RankingItem({ entry, position, isCurrentUser }: Props) {
  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
      <Text style={styles.pos}>{MEDAL[position] ?? `${position}`}</Text>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {entry.displayName}{isCurrentUser ? ' · tú' : ''}
        </Text>
        <Text style={styles.sub}>
          {entry.exactHits} exactos · {entry.resultHits} correctos · {entry.predicted} jugados
        </Text>
      </View>
      <Text style={styles.points}>{entry.totalPoints}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
    backgroundColor: C.surface,
  },
  rowHighlight: { backgroundColor: C.accentLight },
  pos: { width: 32, fontSize: 18, textAlign: 'center', color: C.textSecondary },
  info: { flex: 1, gap: 2 },
  name: { color: C.textPrimary, fontSize: 15, fontWeight: '600' },
  sub: { color: C.textTertiary, fontSize: 12 },
  points: { color: C.accent, fontSize: 22, fontWeight: '800', minWidth: 36, textAlign: 'right' },
});
