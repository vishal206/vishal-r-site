import { embedQuery } from "./embedQuery.ts";
import { loadAllEmbeddings } from "./loadEmbeddings.ts";
import { cosineSimilarity } from "./similarity.ts";

export async function retrieveRelevantChunks(query: string, topK = 5) {
  const queryEmbedding = await embedQuery(query);
  const chunks = await loadAllEmbeddings();

  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
