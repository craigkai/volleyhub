# SvelteKit (SvelteJS 5) + Supabase + Vercel

## Table of Contents
- [SvelteKit (SvelteJS 5) + Supabase + Vercel](#sveltekit-sveltejs-5--supabase--vercel)
  - [Table of Contents](#table-of-contents)
  - [The Problem](#the-problem)
  - [The Format](#the-format)
  - [The Challenges](#the-challenges)
  - [The Tech](#the-tech)
    - [Vercel](#vercel)
    - [Supabase](#supabase)
    - [Svelte 5 and SvelteKit](#svelte-5-and-sveltekit)
  - [The Results](#the-results)
  - [Conclusion](#conclusion)

## The Problem
I regularly attend volleyball tournaments hosted around the Buffalo area. Often times at these events, there is a great amount of effort that goes into creating a balanced "round robin" schedule and keeping teams on this schedule.

Regularly the schedules are handmade and often teams end up playing consecutive games in a row or sitting for far too long, resulting in grumbling and general dissatisfaction.

## The Format

Typically, tournaments follow this format:

1. Play X games of `pool` play -- This is for seeding before going into playoffs.
2. During pool play, teams are expected to ref other teams' matches (this means refs need to be pulled from teams not playing).
3. Teams should ref the same amount of games where possible.
4. Teams should sit in between games logical amounts.

## The Challenges

The problems with creating a schedule by hand are that teams often end up playing multiple games in a row or sitting for too many. Teams are often slow to realize when they should be on the court and even more so when they should be ref'ing.

I knew I wanted to build something for fun and learning using SvelteKit and Supabase, so this is the problem that I chose to tackle (I know scheduling tournaments is a solved problem)!

## The Tech

### Vercel

*"Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web."*

Vercel is an amazing product and a logic choice for deploying my SvelteKit infrastructure through. By utilizing the [Vercel adapter](https://kit.svelte.dev/docs/adapter-vercel) for SvelteKit getting my application up and running in the cloud only took minutes. By using Vercel I had easy access to logs, I find it much simplier than using the AWS console! Deployments for branches and PRs automatically generated and reviewable, and so much more!

<img src="/assets/blog/vercel.png" alt="vercel dashboard" style="width: 100%; margin-top: 20px; margin-bottom: 20px;" />

### Supabase

Another product that has truly impressed me!

*"Supabase is an open source Firebase alternative. Start your project with a Postgres database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, Storage, and Vector embeddings."*

Supabase has made things such as Auth and real time a piece of cake! Supabase handles user Auth and email (amongst other Auth/Notification methods) but it also makes developing a dream. Typically cerating and managing a local test DB can be a pain, and I truly dislike when engineering teams all use one dev cloud test DB (you never know how messed up the DB state is).

Supabase makes it easy to spin up a local Supabase web studio along with a database instance to allow for easy and effective DB testing and version control!

<img src="/assets/blog/supabase.png" alt="supabase" style="width: 100%; margin-top: 20px; margin-bottom: 20px;" />

### Svelte 5 and SvelteKit

coming soon...!

## The Results


Coming soon...!

<img src="/assets/blog/subscribeToChanges.png" alt="subscribe" style="width: 100%; margin-top: 20px; margin-bottom: 20px;" />

## Conclusion

Building a scheduling tool for volleyball tournaments using SvelteKit and Supabase has been a fun and educational experience. It addresses the common issues faced during tournaments and helps in creating a balanced schedule efficiently.
