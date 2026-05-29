import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Group } from '../types';
import { useAuth } from '../contexts/AuthContext';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createGroup = useCallback(
    async (name: string): Promise<Group> => {
      if (!user) throw new Error('Not authenticated');

      const id = doc(collection(db, 'groups')).id;
      const group: Omit<Group, 'id'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
        name,
        code: generateCode(),
        ownerId: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp() as unknown as Date,
      };

      await setDoc(doc(db, 'groups', id), group);
      return { id, ...group } as Group;
    },
    [user]
  );

  const joinGroup = useCallback(
    async (code: string): Promise<Group> => {
      if (!user) throw new Error('Not authenticated');

      const q = query(collection(db, 'groups'), where('code', '==', code.toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) throw new Error('Grupo no encontrado');

      const groupDoc = snap.docs[0];
      const group = { id: groupDoc.id, ...groupDoc.data() } as Group;

      if (group.members.includes(user.uid)) throw new Error('Ya eres miembro de este grupo');

      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayUnion(user.uid),
      });

      return group;
    },
    [user]
  );

  return { groups, loading, createGroup, joinGroup };
}
