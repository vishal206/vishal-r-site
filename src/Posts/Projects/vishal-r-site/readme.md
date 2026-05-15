---
title: "vishal-r-site"
logo: "/v_logo.svg"
description: "My personal portfolio and blog site built with React, Vite, and Tailwind CSS."
featured: true
---

## What is this?

This is my corner of the internet — vishal-r.com. A place where I write about things I'm building, books I'm reading, films I'm watching, cars I'm obsessing over, and whatever else is on my mind that week.

It's part blog, part portfolio, part creative outlet. No algorithm nudging me toward engagement. No CMS telling me how to structure things. Just me, some markdown files, and a build step.

I started building this because I wanted a home on the web that actually felt like *mine* — not a theme I picked from a marketplace, not a Notion page, not a Twitter/X feed. Something I designed pixel by pixel, wrote word by word.

## What's on it?

- **Blog** — longer-form posts on tech, life, and ideas
- **Week Notes** — a running journal of what's been happening week to week
- **Dev Logs** — notes on projects I'm actively building
- **Projects** — a showcase of things I've shipped

## A few things I'm particularly proud of

**The cursor car.** Move your mouse around the site and a little car follows it — complete with physics-based steering, lateral grip, skid marks on sharp turns, burnout smoke on acceleration, and full circle-drift mode if you go in circles long enough. It's completely unnecessary and I love it.

**Movie disk archive.** Blog posts in the archive are displayed as vinyl/DVD discs — each one tilted slightly differently, with a real iridescent shimmer on hover and the post art printed on the surface like a film reel. It's a nod to my love of cinema.

**No database for content.** Every post is a flat markdown file. `import.meta.glob` pulls them all in at build time. No CMS, no admin panel, no hosted backend. The content lives right next to the code.

**Engagement without accounts.** Readers can like and comment on posts without logging in. Firebase handles the counters and comments — it's the only "cloud" piece in the whole stack, and it's only there for that.

**The "Chapters of my life" section.** On the about page, there's a tabbed folder UI — each tab is a chapter of my life so far, written in markdown. It's a weird little detail that I think makes the about page feel less like a resume and more like a person.

**Editorial design.** The whole site is built around a newspaper aesthetic — dark background, Playfair Display for display headings, Lora for body text, tight tracking on labels, and a divider-based grid. I wanted it to feel like a good print publication, not a startup landing page.

## Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite 6
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Markdown:** react-markdown + remark-gfm
- **Backend:** Firebase (view counts, likes, comments only)
- **Fonts:** Playfair Display, Lora, Caveat
- **Hosting:** Static — no server
