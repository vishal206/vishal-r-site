# Ingestion & Embedding Pipeline

This document explains **how markdown content becomes searchable vectors**.

---

## Source of truth

All content originates from:

```
src/Posts/
├── BlogPosts/
├── WeekNotes/
└── DevLogs/
```

These files are:

- human-written
- version controlled
- never modified by the ingestion pipeline

---

## Pipeline overview

```
Markdown file
   ↓
Load from disk
   ↓
Chunk by semantic sections
   ↓
Strip markdown → plain text
   ↓
Hash content (identity)
   ↓
Generate embedding (Ollama)
   ↓
Store in Firestore
```

Each step is explicit and testable.

---

## Step 1 — Load markdown files

Handled by:

```
loadAllMarkdown.ts
```

Responsibilities:

- Walk `src/Posts` recursively
- Return absolute + relative paths
- No parsing, no mutation

Why recursive:

- DevLogs may be nested
- Future-proof

---

## Step 2 — Chunking (semantic, not arbitrary)

Handled by:

```
chunkMarkdown.ts
```

Chunking rules:

- Split by headings (`##`, `###`)
- Each chunk represents one idea
- Headings are preserved as context

Why this matters:

- Better recall precision
- Natural citations
- Less hallucination later

---

## Step 3 — Markdown → plain text

Markdown is **not embedded directly**.

We strip:

- formatting symbols
- links syntax
- code fences

What remains:

- natural language
- idea flow
- author intent

This improves semantic quality of embeddings.

---

## Step 4 — Content hashing (idempotency)

Each chunk is hashed using SHA-256.

```
hash(cleanText) → chunkId
```

This ensures:

- same content = same ID
- safe re-runs
- no duplicate embeddings

Only changed content is re-embedded.

---

## Step 5 — Embedding (local)

Embeddings are generated via:

- Ollama
- Mistral model
- Local HTTP API

Characteristics:

- No external API calls
- No cost
- Full privacy

Embedding length:

- 4096 dimensions

---

## Step 6 — Storage

Each chunk is stored as one Firestore document.

Firestore acts as:

- persistent vector store
- source-of-truth for retrieval

No embeddings are generated at runtime.

---

## Build-time philosophy

Embeddings are treated as **build artifacts**.

This means:

- deterministic
- reproducible
- versionable
- debuggable

Runtime code only reads + compares.
