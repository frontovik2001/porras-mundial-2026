import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Match, Prediction } from '../types';
import { FLAG } from '../constants/flags';
import { C, SHADOW } from '../constants/theme';

interface Props {
  match: Match;
  prediction?: Prediction;
  onSave: (matchId: string, home: number, away: number) => Promise<void>;
}

const POINTS_COLOR: Record<number, string> = {
  5: C.exact,
  2: C.result,
  0: C.miss,
};

export function MatchCard({ match, prediction, onSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [homeInput, setHomeInput] = useState(prediction?.homeScore?.toString() ?? '');
  const [awayInput, setAwayInput] = useState(prediction?.awayScore?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const isUpcoming = match.status === 'upcoming';
  const isFinished = match.status === 'finished';
  const teamsKnown = match.homeTeam !== 'Por definir' && match.awayTeam !== 'Por definir';
  const isPredictable = isUpcoming && teamsKnown;

  function handlePress() {
    if (!isPredictable) return;
    setHomeInput(prediction?.homeScore?.toString() ?? '');
    setAwayInput(prediction?.awayScore?.toString() ?? '');
    setExpanded((e) => !e);
  }

  async function handleSave() {
    if (!homeInput || !awayInput) return;
    setSaving(true);
    try {
      await onSave(match.id, parseInt(homeInput, 10), parseInt(awayInput, 10));
      setExpanded(false);
    } catch {
      // offline: Firestore guarda en caché
    } finally {
      setSaving(false);
    }
  }

  const dateStr = new Date(match.scheduledAt).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const timeStr = new Date(match.scheduledAt).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.teamsRow}>
        {/* Local */}
        <View style={styles.teamBox}>
          <Text style={styles.flag}>{FLAG[match.homeTeam] ?? '🏳️'}</Text>
          <Text style={styles.teamName} numberOfLines={2}>{match.homeTeam}</Text>
        </View>

        {/* Marcador / vs */}
        <View style={styles.center}>
          {isFinished ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                {match.homeScore} – {match.awayScore}
              </Text>
              <Text style={styles.finishedLabel}>FIN</Text>
            </View>
          ) : (
            <Text style={styles.vs}>vs</Text>
          )}
        </View>

        {/* Visitante */}
        <View style={[styles.teamBox, styles.teamBoxRight]}>
          <Text style={styles.flag}>{FLAG[match.awayTeam] ?? '🏳️'}</Text>
          <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={2}>
            {match.awayTeam}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.venue} numberOfLines={1}>{match.venue}</Text>
          <Text style={styles.date}>{dateStr} · {timeStr}</Text>
        </View>
        {prediction != null ? (
          <View style={styles.predBadge}>
            <Text style={styles.predText}>
              Tu pred: {prediction.homeScore}–{prediction.awayScore}
            </Text>
            {prediction.points != null && (
              <Text style={[styles.pts, { color: POINTS_COLOR[prediction.points] ?? C.textSecondary }]}>
                {' '}· {prediction.points}pts
              </Text>
            )}
          </View>
        ) : isPredictable ? (
          <Text style={styles.predCta}>Predecir ✏️</Text>
        ) : isUpcoming && !teamsKnown ? (
          <Text style={styles.pendingCta}>Equipos por definir</Text>
        ) : null}
      </View>

      {/* Input inline */}
      {expanded && isPredictable && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={homeInput}
            onChangeText={setHomeInput}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
            placeholderTextColor={C.textTertiary}
            selectTextOnFocus
            autoFocus
          />
          <Text style={styles.dash}>–</Text>
          <TextInput
            style={styles.input}
            value={awayInput}
            onChangeText={setAwayInput}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
            placeholderTextColor={C.textTertiary}
            selectTextOnFocus
          />
          <Pressable
            style={[styles.saveBtn, (!homeInput || !awayInput || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!homeInput || !awayInput || saving}
          >
            {saving
              ? <ActivityIndicator color={C.accentText} size="small" />
              : <Text style={styles.saveBtnText}>Guardar</Text>}
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 5,
    gap: 12,
    ...SHADOW,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamBox: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  teamBoxRight: {
    alignItems: 'flex-end',
  },
  flag: {
    fontSize: 30,
  },
  teamName: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  center: {
    width: 72,
    alignItems: 'center',
  },
  vs: {
    color: C.textTertiary,
    fontSize: 15,
    fontWeight: '600',
  },
  resultBox: {
    alignItems: 'center',
    gap: 2,
  },
  resultText: {
    color: C.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  finishedLabel: {
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerLeft: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  venue: {
    color: C.textTertiary,
    fontSize: 11,
  },
  date: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  predBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accentLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  predText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  pts: {
    fontSize: 12,
    fontWeight: '700',
  },
  predCta: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  pendingCta: {
    color: C.textTertiary,
    fontSize: 11,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  input: {
    width: 52,
    height: 48,
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  dash: {
    color: C.textTertiary,
    fontSize: 20,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: C.accent,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveBtnText: {
    color: C.accentText,
    fontWeight: '700',
    fontSize: 15,
  },
});
