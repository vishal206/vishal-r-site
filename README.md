# Vishal R - personal website

🌐 https://vishalr.dev

Personal site, writing archive, and experimentation ground — built to be **static-first**, with a small, intentional backend for embeddings and search.

## 🛠️ Tech Stack

**Frontend**

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Markdown (React Markdown + GFM)
- Firebase Hosting

**Backend / Infra**

- Node.js (build-time & server-side)
- Firebase (Firestore, Hosting)
- Ollama (local LLM + embeddings)

## 📚 Documentation

Detailed internal docs live under `docs/`:

- `docs/FUNCTIONS.md` — purpose & structure of the backend
- `docs/INGESTION-PIPELINE.md` — how markdown becomes embeddings
- `docs/FIRESTORE-SCHEMA.md` — vector storage design

Start here if you want to understand _why_ things are built this way.

## 📦 Installation

```bash

# Install dependencies
npm install

# Start development server
npm run dev
```

````

## 🚀 Deployment

The site is configured for Firebase Hosting:

```bash
# Build and deploy
npm run generate-rss
npm run build
firebase deploy
````
