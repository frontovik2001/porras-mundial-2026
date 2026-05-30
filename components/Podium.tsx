import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RankingEntry } from '../types';
import { C, SHADOW } from '../constants/theme';

interface Props {
  top3: RankingEntry[];
  currentUserId?: string;
}

// Colores del podio: oro, plata, bronce
const PODIUM = {
  1: { bg: '#FBBF24', label: '🥇', height: 96 },
  2: { bg: '#94A3B8', label: '🥈', height: 76 },
  3: { bg: '#D97706', label: '🥉', height: 64 },
};

// Orden visual: 2º - 1º - 3º (el campeón en el centro y más alto)
const ORDER = [1, 0, 2];

export function Podium({ top3, currentUserId }: Props) {
  return (
    <View style={styles.wrap}>
      {ORDER.map((idx) => {
        const entry = top3[idx];
        if (!entry) return <View key={idx} style={styles.col} />;
        const position = idx + 1;
        const meta = PODIUM[position as 1 | 2 | 3];
        const isMe = entry.userId === currentUserId;

        return (
          <View key={entry.userId} style={styles.col}>
            <View style={[styles.avatar, isMe && styles.avatarMe]}>
              <Text style={styles.avatarText}>
                {entry.displayName.charAt(0).toUpperCase()}
              </Text>
              <Text style={styles.medal}>{meta.label}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {entry.displayName}{isMe ? ' (tú)' : ''}
            </Text>
            <View style={[styles.bar, { height: meta.height, backgroundColor: meta.bg }]}>
              <Text style={styles.points}>{entry.totalPoints}</Text>
              <Text style={styles.pts}>pts</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  avatarMe: { borderWidth: 3, borderColor: C.accent },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  medal: { position: 'absolute', bottom: -8, fontSize: 18 },
  name: { color: C.textPrimary, fontSize: 12, fontWeight: '700', maxWidth: '100%' },
  bar: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    ...SHADOW,
  },
  points: { color: '#fff', fontSize: 22, fontWeight: '900' },
  pts: { color: '#fff', fontSize: 11, fontWeight: '600', opacity: 0.9 },
});
