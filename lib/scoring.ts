import { Prediction, Match, RankingEntry } from '../types';

export function getMatchResult(homeScore: number, awayScore: number): 'home' | 'draw' | 'away' {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

export function calculatePoints(
  prediction: Pick<Prediction, 'homeScore' | 'awayScore'>,
  result: Pick<Match, 'homeScore' | 'awayScore'>
): number {
  if (result.homeScore === undefined || result.awayScore === undefined) return 0;

  if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
    return 5;
  }

  const predResult = getMatchResult(prediction.homeScore, prediction.awayScore);
  const actualResult = getMatchResult(result.homeScore, result.awayScore);

  return predResult === actualResult ? 2 : 0;
}

export function buildRanking(
  members: { userId: string; displayName: string; photoURL: string | null }[],
  predictions: Prediction[],
  finishedMatches: Match[]
): RankingEntry[] {
  const resultMap = new Map(finishedMatches.map((m) => [m.id, m]));

  const entries = members.map(({ userId, displayName, photoURL }) => {
    const userPredictions = predictions.filter((p) => p.userId === userId);
    let totalPoints = 0;
    let exactHits = 0;
    let resultHits = 0;
    let predicted = 0;

    for (const pred of userPredictions) {
      const match = resultMap.get(pred.matchId);
      if (!match || match.status !== 'finished') continue;

      const pts = calculatePoints(pred, match);
      totalPoints += pts;
      if (pts === 5) exactHits++;
      if (pts === 2) resultHits++;
      predicted++;
    }

    return { userId, displayName, photoURL, totalPoints, exactHits, resultHits, predicted };
  });

  return entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
    return b.resultHits - a.resultHits;
  });
}
