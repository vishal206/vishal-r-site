---
title: "Building the Editorial Design System"
date: "2026-01-10"
---

## Starting Point

I wanted the site to feel like a printed magazine — structured, typographic, with clear hierarchy. Most personal sites either go ultra-minimal (white background, system font) or over-designed. I wanted the middle: dark, editorial, intentional.

## Typography First

The font stack is the foundation:

- **Playfair Display** — Display serif for headings. High contrast, very editorial.
- **Lora** — Body serif for reading. More approachable than Playfair at small sizes.
- **Lexend Zetta** — The UI font. Extremely wide tracking for labels, tags, navigation.

The wide-tracking uppercase labels (`tracking-[0.22em]`) are what give it the "newspaper section header" feel.

## Color Tokens

Everything is built on four colors:

```css
--color-editorial-bg: #111111
--color-editorial-text: #e8e3dc
--color-editorial-divider: #2a2a2a
--color-available: #4ade80
```

The green (`#4ade80`) is the only accent. It signals "active", "featured", "available". Everything else is monochromatic.

## Layout System

The homepage uses a 3-column CSS grid for the hero section. The featured post spans 2 columns, the blog sidebar takes 1. Below that, a 2-column split for Movie and Book sections.

The hardest part was making it feel right on mobile — collapsing the grid gracefully without losing the editorial character.
