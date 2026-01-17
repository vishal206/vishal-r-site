import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import stripMarkdown from "strip-markdown";
import { fileURLToPath } from "url";

import { chunkByHeading } from "./chunkMarkdown.ts";
import { loadAllMarkdownFiles } from "./loadAllMarkdown.ts";

import { db } from "./firebase.ts";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_ROOT = path.resolve(__dirname, "../../src/Posts");

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

function hash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function run() {
  console.log("📂 Loading markdown files...");
  const files = loadAllMarkdownFiles(POSTS_ROOT);

  console.log(`Found ${files.length} markdown files\n`);

  for (const file of files) {
    console.log(`📄 Processing: ${file.relativePath}`);

    const raw = fs.readFileSync(file.filePath, "utf-8");
    const { content, data } = matter(raw);

    const title = data.title ?? path.basename(file.filePath);
    const chunks = chunkByHeading(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const cleanText = await markdownToText(
        `${title}\n${chunk.heading}\n\n${chunk.text}`,
      );

      if (!cleanText.trim()) continue;

      const chunkId = hash(cleanText);
      const docRef = db.collection("embeddings").doc(chunkId);

      const existing = await docRef.get();
      if (existing.exists) {
        console.log(`  ⏭️  Skipped existing chunk ${i + 1}`);
        continue;
      }

      console.log(
        `  ↳ Chunk ${i + 1}/${chunks.length} (${cleanText.length} chars)`,
      );

      const embedding = await embed(cleanText);

      await docRef.set({
        chunkId,
        text: cleanText,
        embedding,
        title,
        heading: chunk.heading,
        category: file.relativePath.split("/")[0],
        sourcePath: file.relativePath,
        chunkIndex: i,
        createdAt: new Date(),
      });

      console.log("     ✅ Stored");
    }

    console.log("");
  }

  console.log("✅ Finished embedding all posts");
}

run().catch((err) => {
  console.error("❌ Error:", err);
});
