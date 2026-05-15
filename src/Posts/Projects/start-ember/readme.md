---
title: "Start Ember"
logo: "/assets/start-ember-logo.svg"
description: "Habit tracker and learning curriculum manager — streaks for what you do daily, tracks for what you're working through."
---

# Start Ember

A habit and learning tracker built to make the invisible visible. Track daily habits with streaks. Work through learning curricula with Tracks. Both in one place, each modeled correctly.

Built on free-tier infrastructure: Supabase (database), Clerk (auth), Vercel (deployment).

**Live:** [start-ember.vercel.app](https://start-ember.vercel.app/)

## Features

- **Daily Dashboard** — toggle habit completions, track streaks, and see a visual progress bar for the day
- **Calendar Analytics** — month-by-month view with completion rates, streaks, and retroactive date editing
- **Habit Management** — create, edit, and delete habits with custom names, icons, and colors
- **Tracks** — named learning curricula with ordered checkpoints; shows completion count and last activity date
- **Habit–Checkpoint Links** — link a track checkpoint to a habit so daily practice and curriculum progress stay connected
- **Authentication** — Google Sign In via Clerk

## Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Database | Supabase (PostgreSQL) |
| Auth | Clerk (Google OAuth) |
| Deployment | Vercel |

## Why Two Modes

Habits and learning tracks are different shapes of work. A habit has no finish line — you're building identity through daily repetition. A track has a beginning and an end — you're moving through material. Mixing the two models causes quiet momentum loss: you feel like you're showing up while making no actual progress through the content.

Start Ember separates them intentionally. Habits track consistency. Tracks track position.
