import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Match } from '../types';

interface Props {
  match: Match;
  initialHome?: number;
  initialAway?: number;
  onSave: (home: number, away: number) => Promise<void>;
}

export function PredictionInput({ match, initialHome, initialAway, onSave }: Props) {
  const [homeScore, setHomeScore] = useState(initialHome?.toString() ?? '');
  const [awayScore, setAwayScore] = useState(initialAway?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const valid = /^\d{1,2}$/.test(homeScore) && /^\d{1,2}$/.test(awayScore);

  async function handleSave() {
    if (!valid) return;
    setError('');
    setSaving(true);
    try {
      await onSave(parseInt(homeScore, 10), parseInt(awayScore, 10));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tu predicción</Text>

      <View style={styles.row}>
        <Text style={styles.team} numberOfLines={2}>{match.homeTeam}</Text>

        <View style={styles.inputs}>
          <TextInput
            style={styles.input}
            value={homeScore}
            onChangeText={setHomeScore}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#475569"
            selectTextOnFocus
          />
          <Text style={styles.dash}>–</Text>
          <TextInput
            style={styles.input}
            value={awayScore}
            onChangeText={setAwayScore}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#475569"
            selectTextOnFocus
          />
        </View>

        <Text style={[styles.team, styles.teamRight]} numberOfLines={2}>{match.awayTeam}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.btn, (!valid || saving) && styles.btnDisabled]}
        onPress={handleSave}
        disabled={!valid || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.btnText}>Guardar predicción</Text>
        )}
      </Pressable>

      <Text style={styles.hint}>
        Exacto: 5 pts &nbsp;·&nbsp; Resultado correcto: 2 pts &nbsp;·&nbsp; Fallo: 0 pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  team: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamRight: {
    textAlign: 'center',
  },
  inputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    width: 52,
    height: 52,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  dash: {
    color: '#64748b',
    fontSize: 20,
    fontWeight: '300',
  },
  btn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  hint: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
  },
});
