const OLLAMA_URL = "http://localhost:11434/api/embeddings";

async function embed(text: string) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral",
      prompt: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.embedding;
}

async function run() {
  const text = `
  I write about time, money, habits,
  and building systems instead of chasing motivation.
  `;

  const embedding = await embed(text);

  console.log("Embedding length:", embedding.length);
  console.log("First 5 numbers:", embedding.slice(0, 5));
}

run().catch(console.error);
