import { retrieveRelevantChunks } from "./retrieve.ts";
import { generateAnswer } from "./generateAnswer.ts";

async function run() {
  const question = "What are my thoughts on productivity and habits?";

  const retrieved = await retrieveRelevantChunks(question, 5);

  const answer = await generateAnswer(
    question,
    retrieved.map((r) => ({
      title: r.title,
      heading: r.heading,
      text: r.text,
    })),
  );

  console.log("\n🧠 Answer:\n");
  console.log(answer);
}

run().catch(console.error);
