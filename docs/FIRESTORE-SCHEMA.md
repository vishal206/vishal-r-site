# Firestore Schema (Embeddings)

This document defines how embeddings are stored and why.

---

## Collection: `embeddings`

Each document represents **one semantic chunk**.

Document ID:

- `chunkId` (SHA-256 hash of content)

---

## Document shape

```ts
{
  chunkId: string,
  text: string,
  embedding: number[],
  title: string,
  heading: string,
  category: string,
  sourcePath: string,
  chunkIndex: number,
  createdAt: Timestamp
}
```

---

## Field explanations

### `chunkId`

- Deterministic identity
- Prevents duplication
- Enables idempotent writes

### `text`

- Clean, plain-text chunk
- Used for context in answers
- Never regenerated at runtime

### `embedding`

- Vector representation (4096 dims)
- Used for similarity search

### `title`

- Post-level context
- Improves relevance

### `heading`

- Section-level context
- Enables fine-grained attribution

### `category`

- BlogPosts | WeekNotes | DevLogs
- Enables filtering later

### `sourcePath`

- Relative path under `src/Posts`
- Used for linking back to content

### `chunkIndex`

- Order within the document
- Helps reconstruct flow

### `createdAt`

- Ingestion timestamp
- Useful for debugging & audits

---

## Why Firestore (for now)

Firestore is used because:

- Already part of the stack
- Admin SDK is reliable
- Small-to-medium scale is fine

This design allows future migration to:

- Dedicated vector DB
- Hybrid search

Without changing ingestion logic.

---

## Read vs Write

- **Writes**: build-time only
- **Reads**: runtime only

This separation is intentional.

---

## What is NOT stored

- Raw markdown
- User queries
- Generated answers

Firestore stores **knowledge**, not interaction history.
