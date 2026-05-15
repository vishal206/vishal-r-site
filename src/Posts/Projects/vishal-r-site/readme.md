---
title: "vishal-r-site"
logo: "/v_logo.svg"
description: "My personal portfolio and blog site built with React, Vite, and Tailwind CSS."
---

## About

This is the source code and design log behind vishal-r.com — my personal site where I write about tech, building things, and whatever is on my mind.

Built with React, Vite, and Tailwind CSS v4. The design follows an editorial newspaper aesthetic with a dark theme, Playfair Display for headings, and Lora for body text.

## Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite 6
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Markdown:** react-markdown + remark-gfm
- **Analytics:** Firebase

## Design Goals

The site is intentionally minimal. No frameworks doing too much, no CMS, just markdown files and a build step. I wanted to own every pixel and not pay for hosting features I don't use.

Posts are flat markdown files loaded at build time via `import.meta.glob`. There's no database — Firebase is only used for view counts, likes, and comments.

## Running Locally

```bash
npm install
npm run dev
```
