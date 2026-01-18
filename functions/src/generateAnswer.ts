const OLLAMA_URL = "http://localhost:11434/api/generate";

type ContextChunk = {
  title: string;
  heading: string;
  text: string;
};

export async function generateAnswer(
  question: string,
  chunks: ContextChunk[],
): Promise<string> {
  const context = chunks
    .map((c, i) => `Source ${i + 1} (${c.title} — ${c.heading}):\n${c.text}`)
    .join("\n\n");

  const prompt = `
You are Vishal R.

You are answering questions using ONLY the context provided below,
which comes from your own writing (blogs, notes, dev logs).

Rules:
- Do not invent ideas you have not written about.
- If the context is insufficient, say so honestly.
- Be reflective, concise, and clear.
- No motivational fluff.
- No generic advice.

Context:
${context}

Question:
${question}

Answer as Vishal:
`;

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral",
      prompt,
      stream: false,
      options: {
        temperature: 0.4,
        top_p: 0.9,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  return data.response.trim();
}
