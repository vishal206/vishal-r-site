import { db } from "./firebase.ts";

export type StoredChunk = {
  chunkId: string;
  text: string;
  embedding: number[];
  title: string;
  heading: string;
  category: string;
  sourcePath: string;
};

export async function loadAllEmbeddings(): Promise<StoredChunk[]> {
  const snapshot = await db.collection("embeddings").get();

  return snapshot.docs.map((doc) => doc.data() as StoredChunk);
}
