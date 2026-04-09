---
title: "Start Ember: How a Drawing Goal Turned Into an App"
date: "05 Apr 2026"
isTech: true
tags: "Devlog"
---

This year, I decided to split my resolutions into quarters, one single goal per quarter. For the first quarter, I chose something I'd always wanted to try: learning to draw characters. The plan was simple. Ten minutes every day. That's it.
The first few days went well. Then, as these things go, it started fading into the background.

So I tried a caveman approach, tally counting. I bought some sticky notes and started marking every day I completed my session. Just seeing those little marks gave me a sense of achievement. But I started missing days again, so I layered on a reward system: complete a 15-day streak and treat myself to a manga( Japanese Comic ).

It was working, but tracking it was becoming a problem in itself. Was I marking today, or had I already marked it? Did I accidentally double-count? The sticky notes were unreliable. That's when it hit me: why not build a small app to do this properly?
And so the developer in me took over.

I kept everything on free tiers: Supabase for the database, Vercel for deployment. I used AI for parts of the coding and UI design, no shame in that. Once the app was live, I realized I didn't want just anyone with the link to see my habit tracking, so I added authentication. Supabase's built-in auth had hit its limit, so I switched to Clerk and integrated Google sign-in. Simple, secure, and no forgotten passwords.

That's how **Start Ember** was born.

> Ember is a hot coal; it symbolizes the habits that are just beginning to take shape, quietly burning before they become something bigger. A little cheesy, maybe, but it felt right.

The app itself is straightforward: create habits, track your streaks, and see a monthly breakdown of how you're doing. I've been using it for 15 days now and have tweaked the design quite a bit along the way. If you have a goal from this year that you've already forgotten about, give it a try. I also snuck in some fun animations.

I have launched it in this week's peerlist, check it out - [Peerlist launchpad](https://peerlist.io/vishal_r_dev/project/start-ember)

👉 [start-ember.vercel.app](https://start-ember.vercel.app/)
