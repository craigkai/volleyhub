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
    - [Realtime updates](#realtime-updates)
  - [Conclusion](#conclusion)

## The Problem

I regularly attend volleyball tournaments hosted around the Buffalo area. Often at these events, there is a significant amount of effort that goes into creating a balanced "round robin" schedule and keeping teams on this schedule.

Regularly, the schedules are handmade, and often teams end up playing consecutive games in a row or sitting for far too long, resulting in grumbling and general dissatisfaction.

## The Format

Typically, tournaments follow this format:

1. Play X games of `pool` play — This is for seeding before going into playoffs.
2. During pool play, teams are expected to ref other teams' matches (this means refs need to be pulled from teams not playing).
3. Teams should ref the same amount of games where possible.
4. Teams should sit in between games logical amounts.

## The Challenges

The problems with creating a schedule by hand are that teams often end up playing multiple games in a row or sitting for too long. Teams are often slow to realize when they should be on the court and even more so when they should be ref'ing.

I knew I wanted to build something for fun and learning using [SvelteKit](https://kit.svelte.dev/) and [Supabase](https://supabase.com/), so this is the problem that I chose to tackle (I know scheduling tournaments is a solved problem)!

## The Tech

### Vercel

> "Vercel provides the developer tools and cloud infrastructure to build, scale, and secure a faster, more personalized web."

[Vercel](https://vercel.com/) is an amazing product and a logical choice for deploying my SvelteKit infrastructure. By utilizing the [Vercel adapter](https://kit.svelte.dev/docs/adapter-vercel) for SvelteKit, getting my application up and running in the cloud only took minutes. By using Vercel, I had easy access to logs, and I find it much simpler than using the AWS console! Deployments for branches and PRs are automatically generated and reviewable, and so much more!

![Vercel Dashboard](/assets/blog/vercel.png)

### Supabase

Another product that has truly impressed me!

> "Supabase is an open-source Firebase alternative. Start your project with a Postgres database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, Storage, and Vector embeddings."

[Supabase](https://supabase.com/) has made things such as Auth and real-time functionality a piece of cake! Supabase handles user Auth and email (amongst other Auth/Notification methods) but also makes developing a dream. Typically creating and managing a local test DB can be a pain, and I truly dislike when engineering teams all use one dev cloud test DB (you never know how messed up the DB state is).

Supabase makes it easy to spin up a local Supabase web studio along with a database instance to allow for easy and effective DB testing and version control!

![Supabase](/assets/blog/supabase.png)

### Svelte 5 and SvelteKit

[Svelte](https://svelte.dev/) is amazing, and working with Svelte 5 has felt really good!

## The Results

### Realtime updates

One of the features I was excited to try out from Supabase was the easy real-time updates that the JS SDK could subscribe to. With a little bit of code:

![Subscribe to Changes](/assets/blog/subscribeToChanges.png)

I could easily have my Svelte components update in real-time when match results were input. This means when an event organizer puts results in, users who have the event open on their mobile devices will get the update pushed straight to their UI without a page refresh.

## Conclusion

Building a scheduling tool for volleyball tournaments using SvelteKit and Supabase has been a fun and educational experience. It addresses the common issues faced during tournaments and helps in creating a balanced schedule efficiently.
