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

export interface PostEngagementData {
  viewCount: number | null;
  likeCount: number;
  liked: boolean;
  toggleLike: () => void;
}

export function usePostEngagement(slug: string | undefined): PostEngagementData {
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const ref = doc(db, 'postImpressions', slug);
    const visitorId = getVisitorId();

    // Increment view count once per visitor per post
    const viewedKey = `viewed_${slug}_${visitorId}`;
    if (!localStorage.getItem(viewedKey)) {
      localStorage.setItem(viewedKey, '1');
      setDoc(ref, { viewCount: increment(1), lastViewed: serverTimestamp() }, { merge: true });
    }

    // Restore liked state from localStorage
    setLiked(!!localStorage.getItem(`liked_${slug}_${visitorId}`));

    // Single listener for both counts
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setViewCount(data.viewCount ?? null);
        setLikeCount(data.likeCount ?? 0);
      } else {
        setLikeCount(0);
      }
    });

    return unsub;
  }, [slug]);

  const toggleLike = () => {
    if (!slug) return;
    const visitorId = getVisitorId();
    const likedKey = `liked_${slug}_${visitorId}`;
    const ref = doc(db, 'postImpressions', slug);
    const isNowLiked = !liked;

    setLiked(isNowLiked);
    setLikeCount((c) => c + (isNowLiked ? 1 : -1));

    if (isNowLiked) localStorage.setItem(likedKey, '1');
    else localStorage.removeItem(likedKey);

    setDoc(ref, { likeCount: increment(isNowLiked ? 1 : -1) }, { merge: true });
  };

  return { viewCount, likeCount, liked, toggleLike };
}
