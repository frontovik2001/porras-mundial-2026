import React, { useMemo, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, Pressable,
} from 'react-native';
import { PHASE_LABELS } from '../../constants/matches';
import { useMatchResults } from '../../hooks/useMatchResults';
import { FLAG } from '../../constants/flags';
import { Match } from '../../types';
import { C, SHADOW } from '../../constants/theme';

type Filter = 'finished' | 'upcoming' | 'all';

export default function ResultadosScreen() {
  const liveMatches = useMatchResults();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const sections = useMemo(() => {
    const filtered = liveMatches.filter((m) => {
      if (filter === 'finished') return m.status === 'finished';
      if (filter === 'upcoming') return m.status === 'upcoming' || m.status === 'live';
      return true;
    });

    const byPhase = new Map<string, Match[]>();
    for (const match of filtered) {
      const key = PHASE_LABELS[match.phase];
      if (!byPhase.has(key)) byPhase.set(key, []);
      byPhase.get(key)!.push(match);
    }
    return Array.from(byPhase.entries()).map(([title, data]) => ({ title, data }));
  }, [filter]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resultados</Text>
        <View style={styles.filters}>
          {(['upcoming', 'finished', 'all'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f === 'upcoming' ? 'Próximos' : f === 'finished' ? 'Finalizados' : 'Todos'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        renderItem={({ item }) => <ResultCard match={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{filter === 'finished' ? '⏳' : '📅'}</Text>
            <Text style={styles.emptyText}>
              {filter === 'finished' ? 'Todavía no hay partidos finalizados' : 'No hay partidos próximos'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ResultCard({ match }: { match: Match }) {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';

  const dateStr = new Date(match.scheduledAt).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const timeStr = new Date(match.scheduledAt).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      {/* Equipos y marcador */}
      <View style={styles.matchRow}>
        <View style={styles.teamSide}>
          <Text style={styles.flag}>{FLAG[match.homeTeam] ?? '🏳️'}</Text>
          <Text style={styles.teamName} numberOfLines={2}>{match.homeTeam}</Text>
        </View>

        <View style={styles.scoreCenter}>
          {isFinished || isLive ? (
            <Text style={styles.score}>{match.homeScore} – {match.awayScore}</Text>
          ) : (
            <Text style={styles.dash}>–</Text>
          )}
        </View>

        <View style={[styles.teamSide, styles.teamSideRight]}>
          <Text style={styles.flag}>{FLAG[match.awayTeam] ?? '🏳️'}</Text>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={2}>{match.awayTeam}</Text>
        </View>
      </View>

      {/* Estadio, fecha y estado */}
      <View style={styles.cardHeader}>
        <View style={styles.venueBlock}>
          <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
          <Text style={styles.date}>{dateStr} · {timeStr}</Text>
        </View>
        {isLive ? (
          <View style={styles.liveBadge}><Text style={styles.liveText}>EN VIVO</Text></View>
        ) : isFinished ? (
          <View style={styles.finBadge}><Text style={styles.finText}>FINAL</Text></View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, gap: 12 },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginVertical: 5, gap: 10, ...SHADOW },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  venueBlock: { flex: 1, gap: 2, marginRight: 8 },
  venue: { color: C.textTertiary, fontSize: 11 },
  date: { color: C.textSecondary, fontSize: 12, fontWeight: '500' },
  liveBadge: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  liveText: { color: C.miss, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  finBadge: { backgroundColor: C.accentLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  finText: { color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  matchRow: { flexDirection: 'row', alignItems: 'center' },
  teamSide: { flex: 1, alignItems: 'flex-start', gap: 4 },
  teamSideRight: { alignItems: 'flex-end' },
  flag: { fontSize: 28 },
  teamName: { color: C.textPrimary, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  teamNameRight: { textAlign: 'right' },
  scoreCenter: { width: 72, alignItems: 'center' },
  score: { color: C.textPrimary, fontSize: 22, fontWeight: '800' },
  dash: { color: C.textTertiary, fontSize: 18 },
  empty: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { color: C.textSecondary, fontSize: 15, textAlign: 'center' },
});
