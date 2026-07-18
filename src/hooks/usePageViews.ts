import { useState, useEffect } from 'react';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { IS_PRERENDER } from '../Utils/env';

/**
 * One-time (non-realtime) fetch of view counts for a set of post slugs — used to
 * show impressions under archive cards. Kept as a single `getDocs` (rather than a
 * live `onSnapshot`) so a passive counter doesn't hold an open listener or bill
 * extra reads on every count change. Firestore's `in` filter caps at 30 values,
 * so callers should pass only the currently visible page of slugs.
 */
export function usePageViews(slugs: string[]): Record<string, number> {
  const [views, setViews] = useState<Record<string, number>>({});

  const key = slugs.join(',');

  useEffect(() => {
    if (slugs.length === 0 || IS_PRERENDER) return;

    let cancelled = false;

    const q = query(
      collection(db, 'postImpressions'),
      where(documentId(), 'in', slugs),
    );

    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const result: Record<string, number> = {};
        snap.forEach((d) => {
          result[d.id] = d.data().viewCount ?? 0;
        });
        setViews(result);
      })
      .catch((err) => console.error('Failed to fetch post views', err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return views;
}
