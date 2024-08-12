# SvelteKit (SvelteJS 5) + Supabase + Vercel

The problem: I regularly attend volleyball tournaments hosted around the Buffalo area. Often times at these events, there is a great amount of effort that goes into creating a balanced "round robin" schedule and keeping teams on this schedule.

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

<img src="/assets/blog/subscribeToChanges.png" alt="subscribe" style="width: 100%; margin-top: 20px; margin-bottom: 20px; " />
