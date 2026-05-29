import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ALL_MATCHES } from '../constants/matches';
import { Match } from '../types';

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
}

/**
 * Devuelve los partidos del Mundial fusionando los datos estáticos (schedule)
 * con los resultados en tiempo real que guarda el script de sync en Firestore.
 */
export function useMatchResults(): Match[] {
  const [matches, setMatches] = useState<Match[]>(ALL_MATCHES);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'matchResults'), (snap) => {
      // Construimos un mapa: "HomeTeam__AwayTeam" → resultado
      const resultMap = new Map<string, MatchResult>();
      snap.docs.forEach((doc) => {
        const d = doc.data() as MatchResult;
        const key = `${d.homeTeam}__${d.awayTeam}`.replace(/\s/g, '_');
        resultMap.set(key, d);
      });

      setMatches(
        ALL_MATCHES.map((m) => {
          const key = `${m.homeTeam}__${m.awayTeam}`.replace(/\s/g, '_');
          const result = resultMap.get(key);
          if (!result) return m;
          return {
            ...m,
            status: result.status,
            homeScore: result.homeScore ?? undefined,
            awayScore: result.awayScore ?? undefined,
          };
        })
      );
    });

    return unsubscribe;
  }, []);

  return matches;
}
