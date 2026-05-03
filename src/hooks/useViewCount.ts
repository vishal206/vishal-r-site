import { useState, useEffect } from 'react';
import { doc, setDoc, increment, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function getVisitorId(): string {
  let id = localStorage.getItem('visitorId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitorId', id);
  }
  return id;
}

export function useViewCount(slug: string | undefined): number | null {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;

    const ref = doc(db, 'postViews', slug);
    const visitorKey = `viewed_${slug}_${getVisitorId()}`;

    if (!localStorage.getItem(visitorKey)) {
      localStorage.setItem(visitorKey, '1');
      setDoc(ref, { viewCount: increment(1), lastViewed: serverTimestamp() }, { merge: true });
    }

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setViewCount(snap.data().viewCount ?? null);
    });

    return unsub;
  }, [slug]);

  return viewCount;
}
