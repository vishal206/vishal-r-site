import { retrieveRelevantChunks } from "./retrieve.ts";

async function run() {
  const query = "thoughts on productivity and habits";

  const results = await retrieveRelevantChunks(query, 5);

  for (const r of results) {
    console.log("—");
    console.log("Score:", r.score.toFixed(3));
    console.log("Title:", r.title);
    console.log("Heading:", r.heading);
    console.log("Text:", r.text.slice(0, 120), "...");
  }
}

run().catch(console.error);
