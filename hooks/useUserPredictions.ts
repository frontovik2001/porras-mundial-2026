import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Prediction } from '../types';

export function useUserPredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'predictions'), where('userId', '==', userId));
    getDocs(q).then((snap) => {
      setPredictions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prediction)));
      setLoading(false);
    });
  }, [userId]);

  const getPrediction = (matchId: string) => predictions.find((p) => p.matchId === matchId);

  return { predictions, loading, getPrediction };
}
