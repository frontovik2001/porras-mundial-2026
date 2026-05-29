import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { PredictionInput } from '../../components/PredictionInput';
import { usePredictions } from '../../hooks/usePredictions';
import { MATCH_BY_ID, PHASE_LABELS } from '../../constants/matches';
import { Match } from '../../types';

export default function PartidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPrediction, savePrediction } = usePredictions();

  const match = MATCH_BY_ID[id ?? ''];
  const prediction = getPrediction(id ?? '');

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Partido no encontrado</Text>
      </View>
    );
  }

  if (match.status !== 'upcoming') {
    const resultLabel =
      match.status === 'finished'
        ? `Resultado: ${match.homeScore} – ${match.awayScore}`
        : 'En curso';

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <MatchInfo match={match} />
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>{resultLabel}</Text>
          {prediction && (
            <Text style={styles.predLabel}>
              Tu predicción: {prediction.homeScore} – {prediction.awayScore}
              {prediction.points != null ? ` · ${prediction.points} pts` : ''}
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  async function handleSave(home: number, away: number) {
    await savePrediction(match.id, home, away);
    Alert.alert('¡Guardado!', 'Tu predicción fue registrada.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <MatchInfo match={match} />
      <PredictionInput
        match={match}
        initialHome={prediction?.homeScore}
        initialAway={prediction?.awayScore}
        onSave={handleSave}
      />
    </ScrollView>
  );
}

function MatchInfo({ match }: { match: Match }) {
  const date = new Date(match.scheduledAt);
  const dateStr = date.toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.matchInfo}>
      <Text style={styles.phase}>
        {match.group ? `Grupo ${match.group} · ` : ''}{PHASE_LABELS[match.phase]}
      </Text>
      <Text style={styles.teams}>
        {match.homeTeam}  vs  {match.awayTeam}
      </Text>
      <Text style={styles.venue}>{match.venue}</Text>
      <Text style={styles.date}>{dateStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    paddingBottom: 48,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#ef4444', fontSize: 16 },
  matchInfo: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  phase: { color: '#64748b', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  teams: { color: '#f1f5f9', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  venue: { color: '#64748b', fontSize: 13 },
  date: { color: '#94a3b8', fontSize: 14 },
  resultBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: { color: '#f1f5f9', fontSize: 22, fontWeight: '800' },
  predLabel: { color: '#94a3b8', fontSize: 15 },
});
