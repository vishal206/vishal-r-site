const OLLAMA_URL = "http://localhost:11434/api/embeddings";

export async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral",
      prompt: text,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  if (!Array.isArray(data.embedding)) {
    throw new Error("Invalid embedding response");
  }

  return data.embedding;
}
