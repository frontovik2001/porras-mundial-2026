import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, Pressable } from 'react-native';
import { MatchCard } from '../../components/MatchCard';
import { usePredictions } from '../../hooks/usePredictions';
import { useMatchResults } from '../../hooks/useMatchResults';
import { PHASE_LABELS, GROUPS } from '../../constants/matches';
import { Match } from '../../types';
import { T } from '../../constants/theme';

type PhaseFilter = 'group' | 'knockout' | 'all';

const FILTERS: { key: PhaseFilter; label: string }[] = [
  { key: 'group',    label: 'Grupos' },
  { key: 'knockout', label: 'Eliminatoria' },
  { key: 'all',      label: 'Todos' },
];

export default function PartidosScreen() {
  const { getPrediction, savePrediction } = usePredictions();
  const liveMatches = useMatchResults();
  const [filter, setFilter] = useState<PhaseFilter>('group');

  const sections = useMemo(() => {
    const filtered = liveMatches.filter((m) => {
      if (filter === 'group')    return m.phase === 'group';
      if (filter === 'knockout') return m.phase !== 'group';
      return true;
    });
    const bySection = new Map<string, Match[]>();
    for (const match of filtered) {
      const key = match.phase === 'group' && match.group ? `Grupo ${match.group}` : PHASE_LABELS[match.phase];
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(match);
    }
    return Array.from(bySection.entries()).map(([title, data]) => ({ title, data }));
  }, [filter, liveMatches]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mundial 2026 · EEUU/MX/CA</Text>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {filter === 'group' && (
              <Text style={styles.sectionSub}>{GROUPS[title.replace('Grupo ', '')]?.teams.join(' · ')}</Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <MatchCard match={item} prediction={getPrediction(item.id)} onSave={savePrediction} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  header: {
    paddingHorizontal: T.space.xl,
    paddingTop: 56,
    paddingBottom: T.space.lg,
    gap: T.space.md,
    backgroundColor: T.color.bg,
  },
  title: { color: T.color.ink, fontSize: 27, fontFamily: 'SchibstedGrotesk_800ExtraBold' },
  filters: { flexDirection: 'row', gap: T.space.sm },
  chip: {
    paddingHorizontal: T.space.md,
    paddingVertical: T.space.xs,
    borderRadius: T.radius.chip,
    borderWidth: 1,
    borderColor: T.color.line,
  },
  chipActive: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  chipText: { color: T.color.ink2, fontSize: 13, fontFamily: 'HankenGrotesk_700Bold' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: T.space.lg, paddingBottom: 32 },
  sectionHeader: { marginTop: T.space.xl, marginBottom: T.space.sm, gap: 2 },
  sectionTitle: { color: T.color.ink, fontSize: 15, fontFamily: 'HankenGrotesk_700Bold' },
  sectionSub:   { color: T.color.ink3, fontSize: 11, fontFamily: 'HankenGrotesk_400Regular' },
});
