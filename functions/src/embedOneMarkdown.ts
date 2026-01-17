import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import stripMarkdown from "strip-markdown";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_URL = "http://localhost:11434/api/embeddings";

async function markdownToText(markdown: string): Promise<string> {
  const result = await remark().use(stripMarkdown).process(markdown);

  return String(result);
}

async function embed(text: string): Promise<number[]> {
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

async function run() {
  const filePath = path.resolve(
    __dirname,
    "../../src/Posts/BlogPosts/time-money-life.md",
  );

  console.log("Reading:", filePath);

  const raw = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(raw);

  const text = await markdownToText(content);

  console.log("Title:", data.title ?? "No title");
  console.log("Text length (chars):", text.length);

  const embedding = await embed(text);

  console.log("Embedding length:", embedding.length);
  console.log("Embedding sample:", embedding.slice(0, 5));
}

run().catch((err) => {
  console.error("❌ Error:", err);
});
