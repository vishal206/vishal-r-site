---
title: "The chunking showdown: Fixed vs Semantic vs Hierarchical"
date: "1 May 2026"
isTech: true
isContextTable: true
tags: "Devlog"
---

Three chunking strategies walked into a RAG pipeline. Only one handled every document type well. Here's what the numbers showed.

Yo! 🙋
When I built my first RAG pipeline, I picked 512 tokens with a 50-token overlap because it was the standard. It worked well enough. In my next project, I tried improving retrieval quality on chunked, embedded text, and noticed that similarity scores were lower than expected. That gap pushed me toward three chunking strategies: Fixed, Semantic, and Hierarchical.

# The Document

To test all three, I created a notebook that runs each strategy against the same document. The document has three sections, each structurally distinct.

**Prose policy:** Three paragraphs describing PTO rules. Continuous, uniform writing. This is what most RAG tutorials assume your entire document looks like.

**FAQ:** Ten Q&A pairs with explicit "Q:" and "A:" formatting. Each pair is a self-contained unit of information.

**Benefits table:** Pipe-delimited rows covering health, dental, and vision plans, structured data with columns like Coverage Limit, Deductible, and Dependents Covered.

Each section was designed to favor a different retrieval approach. The question was which chunking strategy would figure that out.

# The Three Chunkings

**Fixed-size chunking** splits text into chunks of 512 tokens with a 50-token overlap using tiktoken. The overlap exists to prevent key sentences from being split across boundaries. Without it, a sentence that falls right on a chunk edge gets cut in half, and neither resulting chunk retrieves well. This approach is the default in most RAG tutorials and the one I used in my own production system.

**Semantic chunking** embeds each sentence using text-embedding-3-small, then computes cosine similarity between adjacent sentence embeddings. A chunk boundary is placed wherever similarity drops below 0.75, meaning where the topic meaningfully changes. The result is variable-length chunks that respect topical structure rather than token count.

**Hierarchical chunking** operates at two levels. Parent chunks of 512 tokens are split into 128-token child chunks. The child chunks are embedded and indexed for retrieval. When a child chunk matches a query, its parent is returned to the LLM. The idea: retrieve with precision, respond with context.

# The Evaluation

Nine test queries, three per section, were run against all three strategies. For each query, I embedded the query using text-embedding-3-small, computed cosine similarity against all chunks using numpy, and retrieved the top-1 chunk.

The 0.75 dashed line on the charts represents a standard production retrieval threshold. Below it, most systems would trigger a fallback response rather than passing the chunk to the LLM.

## Prose Queries

All three strategies are competitive here, with similarity scores between 0.63 and 0.77. Fixed improved dramatically compared to the 512-token version (which scored 0.38-0.47) because smaller chunks now target specific policy sentences instead of blending three paragraphs together.

Hierarchical edges ahead on Q2 and Q3, retrieving targeted sentences like "Unused PTO does not expire immediately at ye..." The 64-token child chunks are small enough to isolate individual policy statements.

Semantic stays consistent throughout, retrieving focused sentences with similarity scores just below or at the 0.75 threshold.

Fixed still lags on Q1 (0.63) because the 128-token chunk retrieved the section header alongside the relevant sentence, diluting the embedding slightly. A smaller chunk or semantic boundary would have isolated the answer cleanly.

## FAQ Queries

Even with reduced token size, Fixed scores 0.49–0.53 on FAQ queries. It improved from the 0.36–0.45 range at 512 tokens, but it's still nowhere near the 0.75 threshold. The chunk preview tells you why: Fixed retrieved "use flexible scheduling as long as deliverables..." for both the dress code query and the expense report query — two completely different questions retrieving the same wrong chunk. Cross-section contamination persists even at 128 tokens because token boundaries still don't respect Q&A pair boundaries.

Hierarchical improved too from 0.41–0.48 to 0.50–0.60, but still can't crack the threshold. The 64-token child chunks straddle Q&A pairs. A single FAQ answer is often 40–70 tokens, meaning a 64-token child chunk captures one answer and the beginning of the next question, blending their embeddings.

Semantic: 0.91, 0.93, 0.91. Every single query above 0.75, every chunk preview shows the exact Q&A pair. "Q: How do I submit an expense report?" was retrieved for the expense report query. "Q: Who should I contact for IT support?" was retrieved for the IT support query. Precision that token-based strategies simply cannot achieve, regardless of parameter tuning.

The reason is structural: semantic chunking preserves Q&A pairs as atomic units because the similarity between the end of one answer and the start of the next question drops sharply, which is a natural semantic boundary. Token-based strategies have no mechanism to detect this.

## Table Queries

Every strategy stays below the 0.75 threshold. Among all the findings in this experiment, the table results are the most instructive.

Semantic leads: it correctly retrieved "Dental Care Standard | $2,000 annual dental ma..." for the dental query and "Vision Focus Plan | $400 annual vision allowan..." for the vision query. But similarity scores of 0.62–0.69 mean a production confidence filter would reject these retrievals and trigger fallback responses, even though the answer is present.

Fixed improved at 128 tokens, scoring 0.50–0.56 compared to 0.36–0.41 at 512, but it's still retrieving "Plus PPO | $1,000,000 annual medical maximum" for the dental coverage query. That's a different row in the same table. Better than retrieving dress code content, but still the wrong answer.

The core problem is that pipe-delimited tabular text doesn't embed with the same density as prose. The embedding model sees a sparse, repetitive structure in plan names, dollar amounts, and yes/no values and produces similarity scores that are systematically lower than prose, regardless of chunking strategy.

Tables need a different approach entirely: serialize each row as a natural language sentence ("The Dental Care Standard plan covers up to $2,000 annually with a $50 deductible and includes dependents"), embed the sentence, and store the original row for display. No chunking strategy tested here solves this at the embedding level.

# What This Actually Means

The 512/50 default is not neutral. It's a choice optimized for long, uniform documents. Applied to short or structured documents, it actively degrades retrieval quality. On a 926-token document, it produces fewer than two chunks, which isn't retrieval; it's lookup.

Parameter selection isn't a one-time decision. It should be driven by your document length, structure, and the granularity of questions your users will ask.

A cosine similarity below 0.75 means your production system is running blind. All three strategies failed this threshold on table queries. The answer was retrievable, but the similarity score didn't reflect it. That's why cosine similarity alone is an incomplete evaluation metric, and **why the next post in this series covers hybrid search and reranking.**

# The Practical Takeaway

For a production corpus, don't pick one strategy and one set of parameters and apply them everywhere. At upload time, detect document structure, Q&A patterns, table delimiters, and section headers, and route accordingly. Use semantic chunking for FAQ content, tuned fixed-size or hierarchical for long-form prose, and serialize table rows into natural language sentences before embedding. The engineering overhead is real. The alternative is a retrieval system that returns dress code answers for dental coverage queries.

_This is part of a series on AI system design for engineers building production RAG systems._
