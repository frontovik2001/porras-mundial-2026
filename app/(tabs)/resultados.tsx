import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, FlatList, StyleSheet, Pressable } from 'react-native';
import { PHASE_LABELS, GROUPS } from '../../constants/matches';
import { useMatchResults } from '../../hooks/useMatchResults';
import { Flag } from '../../components/Flag';
import { Match } from '../../types';
import { T } from '../../constants/theme';
import { computeAllStandings } from '../../lib/standings';
import { GroupStandingTable } from '../../components/GroupStandingTable';
import { BracketView } from '../../components/BracketView';

type ViewMode = 'matches' | 'standings' | 'bracket';
type Filter   = 'finished' | 'upcoming' | 'all';

const VIEW_TABS: { key: ViewMode; label: string }[] = [
  { key: 'matches',   label: 'Partidos' },
  { key: 'standings', label: 'Grupos' },
  { key: 'bracket',   label: 'Cuadro' },
];
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Finalizados' },
  { key: 'all',      label: 'Todos' },
];

export default function ResultadosScreen() {
  const liveMatches = useMatchResults();
  const [view,   setView]   = useState<ViewMode>('matches');
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
  }, [filter, liveMatches]);

  const standings    = useMemo(() => computeAllStandings(liveMatches), [liveMatches]);
  const groupLetters = Object.keys(GROUPS);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resultados</Text>

        <View style={styles.segmented}>
          {VIEW_TABS.map((t) => (
            <Pressable key={t.key} style={[styles.segment, view === t.key && styles.segmentActive]} onPress={() => setView(t.key)}>
              <Text style={[styles.segmentText, view === t.key && styles.segmentTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {view === 'matches' && (
          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <Pressable key={f.key} style={[styles.chip, filter === f.key && styles.chipActive]} onPress={() => setFilter(f.key)}>
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {view === 'bracket' ? (
        <BracketView matches={liveMatches} />
      ) : view === 'matches' ? (
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
      ) : (
        <FlatList
          data={groupLetters}
          keyExtractor={(g) => g}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: T.color.good }]} /><Text style={styles.legendText}>Clasifica (1º-2º)</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#D97706' }]} /><Text style={styles.legendText}>Posible mejor 3º</Text></View>
            </View>
          }
          renderItem={({ item }) => (
            <GroupStandingTable groupLetter={item} standings={standings.byGroup[item]} />
          )}
        />
      )}
    </View>
  );
}

function ResultCard({ match }: { match: Match }) {
  const isFinished = match.status === 'finished';
  const isLive     = match.status === 'live';
  const dateStr = new Date(match.scheduledAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = new Date(match.scheduledAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.matchRow}>
        <View style={styles.teamSide}>
          <Flag team={match.homeTeam} size={32} />
          <Text style={styles.teamName} numberOfLines={2}>{match.homeTeam}</Text>
        </View>
        <View style={styles.scoreCenter}>
          {isFinished || isLive ? (
            <Text style={styles.score}>{match.homeScore} – {match.awayScore}</Text>
          ) : (
            <Text style={styles.timeLarge}>{timeStr}</Text>
          )}
          {isLive
            ? <View style={styles.liveBadge}><Text style={styles.liveText}>EN VIVO</Text></View>
            : isFinished
              ? <Text style={styles.finText}>FIN</Text>
              : <Text style={styles.dateSub}>{dateStr}</Text>}
        </View>
        <View style={[styles.teamSide, styles.teamSideRight]}>
          <Flag team={match.awayTeam} size={32} />
          <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={2}>{match.awayTeam}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: { paddingHorizontal: T.space.xl, paddingTop: 56, paddingBottom: T.space.lg, gap: T.space.md, backgroundColor: T.color.bg },
  title:  { color: T.color.ink, fontSize: 27, fontFamily: 'SchibstedGrotesk_800ExtraBold' },
  segmented: { flexDirection: 'row', backgroundColor: T.color.line, borderRadius: 12, padding: 3, gap: 3 },
  segment:   { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: T.color.surface, ...T.shadow },
  segmentText:       { color: T.color.ink2, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },
  segmentTextActive: { color: T.color.accent },
  filters: { flexDirection: 'row', gap: T.space.sm },
  chip:       { paddingHorizontal: T.space.md, paddingVertical: T.space.xs, borderRadius: T.radius.chip, borderWidth: 1, borderColor: T.color.line },
  chipActive: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  chipText:       { color: T.color.ink2, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },
  chipTextActive: { color: '#fff' },
  list:         { paddingHorizontal: T.space.lg, paddingBottom: 32 },
  sectionTitle: { color: T.color.ink, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: T.space.xl, marginBottom: T.space.sm },
  legend:     { flexDirection: 'row', gap: 16, paddingVertical: 8, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 4, height: 14, borderRadius: 2 },
  legendText: { color: T.color.ink2, fontSize: 12, fontFamily: 'HankenGrotesk_500Medium' },
  card: { backgroundColor: T.color.surface, borderRadius: T.radius.card, padding: 14, marginVertical: 5, borderWidth: 1, borderColor: T.color.line, gap: 10, ...T.shadow },
  matchRow:    { flexDirection: 'row', alignItems: 'center' },
  teamSide:    { flex: 1, alignItems: 'flex-start', gap: 4 },
  teamSideRight: { alignItems: 'flex-end' },
  teamName:    { color: T.color.ink, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold', lineHeight: 18 },
  scoreCenter: { width: 80, alignItems: 'center', gap: 2 },
  score:       { color: T.color.ink, fontSize: 22, fontFamily: 'SchibstedGrotesk_700Bold' },
  timeLarge:   { color: T.color.ink, fontSize: 18, fontFamily: 'SchibstedGrotesk_700Bold' },
  finText:     { color: T.color.ink3, fontSize: 10, fontFamily: 'HankenGrotesk_500Medium', letterSpacing: 0.8 },
  dateSub:     { color: T.color.ink3, fontSize: 11, fontFamily: 'HankenGrotesk_500Medium' },
  liveBadge:   { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  liveText:    { color: T.color.danger, fontSize: 10, fontFamily: 'HankenGrotesk_700Bold', letterSpacing: 0.5 },
  cardFooter:  { borderTopWidth: 1, borderTopColor: T.color.line, paddingTop: 8 },
  venue:       { color: T.color.ink3, fontSize: 11, fontFamily: 'HankenGrotesk_400Regular' },
  empty:       { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyEmoji:  { fontSize: 40 },
  emptyText:   { color: T.color.ink2, fontSize: 15, fontFamily: 'HankenGrotesk_500Medium', textAlign: 'center' },
});
