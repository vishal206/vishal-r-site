import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

export interface ProjectStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export function useProjectStats(projectSlug: string | undefined): ProjectStats | null {
  const [stats, setStats] = useState<ProjectStats | null>(null);

  useEffect(() => {
    if (!projectSlug) return;
    const slug = `project-${projectSlug}`;
    const ref = doc(db, 'postImpressions', slug);

    const unsub = onSnapshot(ref, async (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const viewCount = data.viewCount ?? 0;
      const likeCount = data.likeCount ?? 0;

      // Get comment count from subcollection size
      const commentSnap = await getCountFromServer(collection(db, 'postImpressions', slug, 'comments'));
      setStats({ viewCount, likeCount, commentCount: commentSnap.data().count });
    });

    return unsub;
  }, [projectSlug]);

  return stats;
}
