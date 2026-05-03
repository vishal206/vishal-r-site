import { useState, useEffect } from 'react';
import { doc, setDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function getVisitorId(): string {
  let id = localStorage.getItem('visitorId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitorId', id);
  }
  return id;
}

export function useLikeCount(slug: string | undefined): {
  likeCount: number;
  liked: boolean;
  toggleLike: () => void;
} {
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const likedKey = `liked_${slug}_${getVisitorId()}`;
    setLiked(!!localStorage.getItem(likedKey));

    const ref = doc(db, 'postImpressions', slug);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setLikeCount(snap.data().likeCount ?? 0);
      else setLikeCount(0);
    });

    return unsub;
  }, [slug]);

  const toggleLike = () => {
    if (!slug) return;
    const likedKey = `liked_${slug}_${getVisitorId()}`;
    const ref = doc(db, 'postImpressions', slug);
    const isNowLiked = !liked;

    setLiked(isNowLiked);
    setLikeCount((c) => c + (isNowLiked ? 1 : -1));

    if (isNowLiked) {
      localStorage.setItem(likedKey, '1');
    } else {
      localStorage.removeItem(likedKey);
    }

    setDoc(ref, { likeCount: increment(isNowLiked ? 1 : -1) }, { merge: true });
  };

  return { likeCount, liked, toggleLike };
}
