import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, Pressable } from 'react-native';
import { MatchCard } from '../../components/MatchCard';
import { usePredictions } from '../../hooks/usePredictions';
import { useMatchResults } from '../../hooks/useMatchResults';
import { PHASE_LABELS, GROUPS } from '../../constants/matches';
import { Match } from '../../types';
import { C } from '../../constants/theme';

type PhaseFilter = 'group' | 'knockout' | 'all';

export default function PartidosScreen() {
  const { getPrediction, savePrediction } = usePredictions();
  const liveMatches = useMatchResults();
  const [filter, setFilter] = useState<PhaseFilter>('group');

  const sections = useMemo(() => {
    const filtered = liveMatches.filter((m) => {
      if (filter === 'group') return m.phase === 'group';
      if (filter === 'knockout') return m.phase !== 'group';
      return true;
    });

    const bySection = new Map<string, Match[]>();
    for (const match of filtered) {
      const key =
        match.phase === 'group' && match.group
          ? `Grupo ${match.group}`
          : PHASE_LABELS[match.phase];
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key)!.push(match);
    }
    return Array.from(bySection.entries()).map(([title, data]) => ({ title, data }));
  }, [filter]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mundial 2026</Text>
        <View style={styles.filters}>
          {(['group', 'knockout', 'all'] as PhaseFilter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f === 'group' ? 'Grupos' : f === 'knockout' ? 'Eliminatoria' : 'Todos'}
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
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {filter === 'group' && <Text style={styles.sectionSub}>{GROUPS[title.replace('Grupo ', '')]?.teams.join(' · ')}</Text>}
          </View>
        )}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            prediction={getPrediction(item.id)}
            onSave={savePrediction}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: C.bg,
  },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: { marginTop: 20, marginBottom: 8, gap: 2 },
  sectionTitle: { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  sectionSub: { color: C.textTertiary, fontSize: 11 },
});
