# functions/

This folder contains all **backend, build-time, and infrastructure code** for the site. Nothing here is shipped to the browser.

The primary responsibilities of `functions/` are:

- Ingest markdown content from `src/Posts`
- Chunk content into semantic units
- Generate embeddings using **local Ollama (Mistral)**
- Store embeddings idempotently in Firestore
- (Later) retrieve embeddings for similarity search and Q&A

---

## Why this folder exists

The frontend (Vite + React) is intentionally kept **static and dumb**.

Anything that:

- reads files from disk
- uses secrets
- talks to databases
- runs at build time or server time

**must live here**.

This keeps:

- security tight
- frontend bundle small
- architecture understandable

---

## High-level structure

```
functions/
├── src/
│   ├── embedAllMarkdown.ts   # Main ingestion script
│   ├── chunkMarkdown.ts     # Chunking logic (semantic)
│   ├── loadAllMarkdown.ts   # Recursive markdown loader
│   ├── firebase.ts          # Firestore initialization
│   └── (future) search.ts   # Similarity search
│
├── serviceAccount.json      # Firebase Admin credentials (gitignored)
├── package.json
└── tsconfig.json
```

---

## Execution model

There are **two kinds of code** in this folder:

1. **One-off / build-time scripts**
   - Example: `embedAllMarkdown.ts`
   - Run manually or during build

2. **Reusable modules**
   - Chunking
   - Loading
   - Firestore setup

There is **no long-running server** here.

---

## Design principles

- Idempotent by default (safe to re-run)
- Deterministic outputs (hash-based IDs)
- Local-first (Ollama, not OpenAI)
- Build-time > runtime

---

## What does NOT belong here

- UI components
- React hooks
- Browser APIs
- Client-side Firebase SDK

If it runs in the browser, it does not belong in `functions/`.
