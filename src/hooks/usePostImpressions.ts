import { useState, useEffect } from 'react';
import { collection, query, where, documentId, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { IS_PRERENDER } from '../Utils/env';

export interface PostCounts {
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export function usePostImpressions(slugs: string[]): Record<string, PostCounts> {
  const [counts, setCounts] = useState<Record<string, PostCounts>>({});

  useEffect(() => {
    if (slugs.length === 0 || IS_PRERENDER) return;

    const q = query(
      collection(db, 'postImpressions'),
      where(documentId(), 'in', slugs),
    );

    const unsub = onSnapshot(q, (snap) => {
      const result: Record<string, PostCounts> = {};
      snap.forEach((d) => {
        const data = d.data();
        result[d.id] = {
          viewCount: data.viewCount ?? 0,
          likeCount: data.likeCount ?? 0,
          commentCount: data.commentCount ?? 0,
        };
      });
      setCounts(result);
    });

    return unsub;
  }, [slugs.join(',')]);

  return counts;
}
