import { useState, useEffect } from 'react';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Comment {
  id: string;
  name: string;
  text: string;
  createdAt: Date | null;
}

export function useComments(slug: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const q = query(
      collection(db, 'postImpressions', slug, 'comments'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || 'Anonymous',
        text: d.data().text,
        createdAt: d.data().createdAt?.toDate() ?? null,
      })));
    });
    return unsub;
  }, [slug]);

  const submitComment = async (text: string, name: string) => {
    if (!slug || !text.trim()) return;
    setSubmitting(true);
    await addDoc(collection(db, 'postImpressions', slug, 'comments'), {
      name: name.trim() || 'Anonymous',
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    setSubmitting(false);
  };

  return { comments, submitting, submitComment };
}
