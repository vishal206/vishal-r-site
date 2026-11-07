import { useState, useEffect } from 'react';
import { doc, setDoc, increment, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { IS_PRERENDER } from '../Utils/env';

function getVisitorId(): string {
  let id = localStorage.getItem('visitorId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitorId', id);
  }
  return id;
}

// Likes were removed; clear the per-post `liked_*` flags older visits left behind.
function clearLegacyLikeKeys() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('liked_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable — nothing to clean
  }
}

export interface PostEngagementData {
  viewCount: number | null;
}

export function usePostEngagement(slug: string | undefined): PostEngagementData {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug || IS_PRERENDER) return;

    const ref = doc(db, 'postImpressions', slug);
    const visitorId = getVisitorId();
    clearLegacyLikeKeys();

    // Increment view count once per visitor per post (never during prerender —
    // a headless build render must not count as a real view)
    const viewedKey = `viewed_${slug}_${visitorId}`;
    if (!IS_PRERENDER && !localStorage.getItem(viewedKey)) {
      localStorage.setItem(viewedKey, '1');
      setDoc(ref, { viewCount: increment(1), lastViewed: serverTimestamp() }, { merge: true });
    }

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setViewCount(snap.data().viewCount ?? null);
    });

    return unsub;
  }, [slug]);

  return { viewCount };
}
