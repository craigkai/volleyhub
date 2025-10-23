# Mix-and-Match / King & Queen Tournament Support Plan

## Overview

This plan outlines the changes needed to support mix-and-match style tournaments (e.g., King & Queen) where:
- Teams change between rounds/matches
- Individual players are tracked across all matches
- Seeding and standings are based on individual performance
- Partners rotate throughout the tournament

### Supported Formats:
- **2v2 Beach Doubles** - Traditional doubles with rotating partners
- **3v3 Grass** - Three-player teams with mix-and-match
- **4v4** - Four-player teams (2 males + 2 females for King & Queen)
- **6v6 Indoor** - Full indoor volleyball with rotating rosters (3 males + 3 females for King & Queen)
- **Any team size** - Flexible system supports any configuration

---

## Current Architecture Summary

### What We Have Now:
- **Fixed Teams**: Teams are created once and remain constant throughout the tournament
- **Team-Based Scoring**: Scores and wins tracked at the team level
- **Team-Based Seeding**: Standings calculated from team performance
- **No Player Entity**: Players are implicit within teams, not tracked individually
- **Two Tournament Types**: Pool play (round-robin) and single-elimination brackets

### Key Files:
- Database: `/supabase/migrations/20240619014844_remote_schema.sql`
- Models: `/src/lib/event.svelte.ts`, `/src/lib/teams.svelte.ts`, `/src/lib/matches.svelte.ts`
- Standings: `/src/lib/standings.svelte.ts`
- Brackets: `/src/lib/brackets/brackets.svelte.ts`

---

## What Needs to Change

### Phase 1: Database Schema Changes

**Key Design Choice**: Use a `player_teams` junction table to support flexible team sizes (2v2, 3v3, 6v6, etc.). This allows the same infrastructure to handle beach doubles, indoor 6s, and any other team configuration. While it adds one more table, it's the standard database pattern for many-to-many relationships and is fully supported by Supabase's nested queries.

#### 1.1 Create Players Table
```sql
CREATE TABLE "public"."players" (
    "id" bigserial PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT now(),
    "name" text NOT NULL,
    "event_id" bigint REFERENCES "public"."events"(id) ON DELETE CASCADE,
    "email" text,                    -- Optional for contact
    "phone" text,                    -- Optional for contact
    "gender" text,                   -- For gender-specific tournaments
    "skill_level" integer,           -- Optional rating/skill level
    "state" text DEFAULT 'active'    -- active, withdrawn, etc.
);

CREATE INDEX idx_players_event ON "public"."players"(event_id);
```

#### 1.2 Create Player-Team Junction Table
```sql
CREATE TABLE "public"."player_teams" (
    "id" bigserial PRIMARY KEY,
    "player_id" bigint REFERENCES "public"."players"(id) ON DELETE CASCADE,
    "team_id" bigint REFERENCES "public"."teams"(id) ON DELETE CASCADE,
    "position" text,                 -- Optional: setter, hitter, outside, etc.
    "created_at" timestamp with time zone DEFAULT now(),
    UNIQUE(player_id, team_id)       -- Player can't be on same team twice
);

CREATE INDEX idx_player_teams_player ON "public"."player_teams"(player_id);
CREATE INDEX idx_player_teams_team ON "public"."player_teams"(team_id);
```

**Why Junction Table?**
- Supports any team size: 2v2, 3v3, 4v4, 6v6
- Same player can be on different teams in different rounds
- Can track position/role if needed
- Standard database pattern with excellent Supabase support

#### 1.3 Add Tournament Type and Team Size to Events Table
```sql
ALTER TABLE "public"."events"
ADD COLUMN "tournament_type" text DEFAULT 'fixed-teams',
ADD COLUMN "team_size" integer DEFAULT 2;
-- tournament_type values: 'fixed-teams', 'mix-and-match', 'king-and-queen'
-- team_size: 2 (doubles), 3, 4, 6 (indoor), etc.
```

**Note**: The `team_size` field specifies the default team size for the tournament. For King & Queen, this must be an even number (equal males and females per team).

#### 1.4 Modify Teams Table
```sql
ALTER TABLE "public"."teams"
ADD COLUMN "is_temporary" boolean DEFAULT false,  -- For generated pairings
ADD COLUMN "round" integer,                       -- Which round this team played
ADD COLUMN "team_size" integer;                   -- Expected team size (2, 3, 4, 6, etc.)

CREATE INDEX idx_teams_round ON "public"."teams"(round);
```

**Note**: Team roster is managed through the `player_teams` junction table. The `team_size` field is optional metadata to specify expected roster size (e.g., 2 for doubles, 6 for indoor).

#### 1.5 Create Player Stats Table (for individual tracking)
```sql
CREATE TABLE "public"."player_stats" (
    "id" bigserial PRIMARY KEY,
    "player_id" bigint REFERENCES "public"."players"(id) ON DELETE CASCADE,
    "event_id" bigint REFERENCES "public"."events"(id) ON DELETE CASCADE,
    "match_id" bigint REFERENCES "public"."matches"(id) ON DELETE CASCADE,
    "points_scored" integer DEFAULT 0,
    "points_allowed" integer DEFAULT 0,
    "win" boolean DEFAULT false,
    UNIQUE(player_id, match_id)
);

CREATE INDEX idx_player_stats_player ON "public"."player_stats"(player_id);
CREATE INDEX idx_player_stats_event ON "public"."player_stats"(event_id);
```

### Migration File Location:
`/supabase/migrations/YYYYMMDDHHMMSS_add_mix_and_match_support.sql`

---

### Working with the Junction Table

The `player_teams` junction table makes it easy to support any team size. Here are common query patterns:

#### Get all players for a team:
```typescript
const { data } = await supabase
    .from('teams')
    .select(`
        *,
        player_teams(
            player_id,
            players(*)
        )
    `)
    .eq('id', teamId)
    .single();

// Access players: data.player_teams.map(pt => pt.players)
```

#### Get all teams a player has been on:
```typescript
const { data } = await supabase
    .from('player_teams')
    .select(`
        *,
        teams(*)
    `)
    .eq('player_id', playerId);
```

#### Create a team with players:
```typescript
// 1. Create team
const { data: team } = await supabase
    .from('teams')
    .insert({ name: 'Team A', event_id: 123, is_temporary: true })
    .select()
    .single();

// 2. Add players to team
await supabase
    .from('player_teams')
    .insert([
        { team_id: team.id, player_id: player1.id },
        { team_id: team.id, player_id: player2.id }
        // Add more players for 6v6, etc.
    ]);
```

#### Example Use Cases:

**2v2 Beach Doubles:**
```
Team "Smith & Jones"
├── player_teams[0]: player_id = 1 (John Smith)
└── player_teams[1]: player_id = 2 (Jane Jones)
```

**6v6 Indoor:**
```
Team "Aces"
├── player_teams[0]: player_id = 1, position = "setter"
├── player_teams[1]: player_id = 2, position = "outside"
├── player_teams[2]: player_id = 3, position = "middle"
├── player_teams[3]: player_id = 4, position = "opposite"
├── player_teams[4]: player_id = 5, position = "libero"
└── player_teams[5]: player_id = 6, position = "outside"
```

**King & Queen 6s (3 males + 3 females per team):**
```
Team "Round 1 - Court 1 - Team A"
├── player_teams[0]: player_id = 1 (Male, ranked #1)
├── player_teams[1]: player_id = 2 (Male, ranked #3)
├── player_teams[2]: player_id = 3 (Male, ranked #5)
├── player_teams[3]: player_id = 10 (Female, ranked #1)
├── player_teams[4]: player_id = 11 (Female, ranked #3)
└── player_teams[5]: player_id = 12 (Female, ranked #5)
```

---

### Phase 2: Data Models & Classes

#### 2.1 Create Player Model
**New File**: `/src/lib/player.svelte.ts`
```typescript
import { Base } from './base';
import type { PlayerRow } from '../types/database';

export class Player extends Base {
    id?: number = $state();
    name: string = $state('');
    event_id?: number = $state();
    email?: string = $state();
    phone?: string = $state();
    gender?: string = $state();
    skill_level?: number = $state();
    state: string = $state('active');
    created_at?: string = $state();

    // Computed stats
    wins: number = $state(0);
    losses: number = $state(0);
    pointsDiff: number = $state(0);
    totalPoints: number = $state(0);
    matchesPlayed: number = $state(0);
}
```

#### 2.2 Create Players Collection Model
**New File**: `/src/lib/players.svelte.ts`
```typescript
import type { Snippet } from 'svelte';
import { Player } from './player.svelte';
import type { PlayerRow } from '../types/database';

export class Players extends Base {
    players: Player[] = $state([]);

    async load(eventId: number): Promise<void> { ... }
    async create(player: Player): Promise<Player> { ... }
    async delete(playerId: number): Promise<void> { ... }

    // Get player by ID
    getById(id: number): Player | undefined { ... }

    // Calculate individual standings
    calculateStandings(): Player[] { ... }
}
```

#### 2.3 Create Player Stats Model
**New File**: `/src/lib/playerStats.svelte.ts`
```typescript
export class PlayerStats extends Base {
    id?: number = $state();
    player_id: number = $state();
    event_id: number = $state();
    match_id: number = $state();
    points_scored: number = $state(0);
    points_allowed: number = $state(0);
    win: boolean = $state(false);
}
```

#### 2.4 Update Team Model
**Modify File**: `/src/lib/team.svelte.ts`

Add properties:
```typescript
export class Team extends Base {
    // ... existing properties
    is_temporary?: boolean = $state(false);
    round?: number = $state();
    players?: Player[] = $state([]);  // Associated players
}
```

#### 2.5 Create Pairing Generator
**New File**: `/src/lib/pairingGenerator.svelte.ts`
```typescript
export class PairingGenerator {
    /**
     * Generate pairings for king/queen tournament
     * Ensures players don't repeat partners until necessary
     */
    async generateKingQueenPairings(
        players: Player[],
        round: number,
        previousMatches: Match[]
    ): Promise<Team[]> { ... }

    /**
     * Generate pairings for mix-and-match
     * Can use various algorithms: random, skill-balanced, etc.
     */
    async generateMixAndMatchPairings(
        players: Player[],
        round: number,
        method: 'random' | 'balanced' | 'rotation'
    ): Promise<Team[]> { ... }

    /**
     * Track which players have played together
     */
    private getPartnerHistory(
        playerId: number,
        matches: Match[]
    ): Set<number> { ... }
}
```

---

### Phase 3: Database Services

#### 3.1 Create Player Database Service
**New File**: `/src/lib/database/player.ts`
```typescript
import { SupabaseDatabaseService } from './supabaseDatabaseService';
import type { PlayerRow } from '../../types/database';
import { playerSchema } from '../../schemas/playerSchema';

export class PlayerSupabaseDatabaseService extends SupabaseDatabaseService<PlayerRow> {
    constructor() {
        super('players', playerSchema);
    }
}
```

#### 3.2 Create Players Database Service
**New File**: `/src/lib/database/players.ts`
```typescript
import { SupabaseDatabaseService } from './supabaseDatabaseService';
import type { PlayerRow } from '../../types/database';
import { playerSchema } from '../../schemas/playerSchema';

export class PlayersSupabaseDatabaseService extends SupabaseDatabaseService<PlayerRow[]> {
    constructor() {
        super('players', playerSchema.array());
    }

    async loadByEvent(eventId: number): Promise<PlayerRow[]> {
        const { data, error } = await this.supabase
            .from('players')
            .select('*')
            .eq('event_id', eventId)
            .eq('state', 'active');

        if (error) throw error;
        return this.validate(data);
    }
}
```

#### 3.3 Create Player Stats Database Service
**New File**: `/src/lib/database/playerStats.ts`
```typescript
import { SupabaseDatabaseService } from './supabaseDatabaseService';
import type { PlayerStatsRow } from '../../types/database';

export class PlayerStatsSupabaseDatabaseService extends SupabaseDatabaseService<PlayerStatsRow> {
    constructor() {
        super('player_stats', playerStatsSchema);
    }

    async loadByEvent(eventId: number): Promise<PlayerStatsRow[]> { ... }
    async loadByPlayer(playerId: number): Promise<PlayerStatsRow[]> { ... }
    async createBatch(stats: PlayerStatsRow[]): Promise<void> { ... }
}
```

#### 3.4 Update Match Service
**Modify File**: `/src/lib/database/match.ts`

Add method to save player stats when match completes:
```typescript
async savePlayerStats(
    matchId: number,
    team1Id: number,
    team2Id: number,
    team1Score: number,
    team2Score: number
): Promise<void> {
    // Get players for both teams via junction table
    const { data: team1Players } = await this.supabase
        .from('player_teams')
        .select('player_id')
        .eq('team_id', team1Id);

    const { data: team2Players } = await this.supabase
        .from('player_teams')
        .select('player_id')
        .eq('team_id', team2Id);

    const team1Won = team1Score > team2Score;
    const statsToInsert = [];

    // Add stats for team1 players
    for (const pt of team1Players) {
        statsToInsert.push({
            player_id: pt.player_id,
            match_id: matchId,
            points_scored: team1Score,
            points_allowed: team2Score,
            win: team1Won
        });
    }

    // Add stats for team2 players
    for (const pt of team2Players) {
        statsToInsert.push({
            player_id: pt.player_id,
            match_id: matchId,
            points_scored: team2Score,
            points_allowed: team1Score,
            win: !team1Won
        });
    }

    await playerStatsService.createBatch(statsToInsert);
}
```

---

### Phase 4: Schemas & Validation

#### 4.1 Create Player Schema
**New File**: `/src/schemas/playerSchema.ts`
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const playerSchema = z.object({
    id: z.number().optional(),
    created_at: z.string().optional(),
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name must be less than 100 characters')
        .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
    event_id: z.number().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    skill_level: z.number().min(1).max(10).optional(),
    state: z.string().default('active')
});

export type PlayerSchema = z.infer<typeof playerSchema>;
```

#### 4.2 Create Player Stats Schema
**New File**: `/src/schemas/playerStatsSchema.ts`
```typescript
import { z } from 'zod';

export const playerStatsSchema = z.object({
    id: z.number().optional(),
    player_id: z.number(),
    event_id: z.number(),
    match_id: z.number(),
    points_scored: z.number().min(0).default(0),
    points_allowed: z.number().min(0).default(0),
    win: z.boolean().default(false)
});

export type PlayerStatsSchema = z.infer<typeof playerStatsSchema>;
```

#### 4.3 Update Event Schema
**Modify File**: `/src/schemas/eventSchema.ts`

Add tournament_type:
```typescript
export const eventSchema = z.object({
    // ... existing fields
    tournament_type: z.enum(['fixed-teams', 'mix-and-match', 'king-and-queen'])
        .default('fixed-teams')
});
```

---

### Phase 5: Individual Standings Calculation

#### 5.1 Create Individual Standings Logic
**New File**: `/src/lib/individualStandings.svelte.ts`
```typescript
import type { Player } from './player.svelte';
import type { PlayerStatsRow } from '../types/database';

export interface IndividualStanding {
    player: Player;
    wins: number;
    losses: number;
    pointsDiff: number;
    totalPoints: number;
    matchesPlayed: number;
    winPercentage: number;
}

export function calculateIndividualStandings(
    players: Player[],
    stats: PlayerStatsRow[]
): IndividualStanding[] {
    const standings: IndividualStanding[] = [];

    for (const player of players) {
        const playerStats = stats.filter(s => s.player_id === player.id);

        const wins = playerStats.filter(s => s.win).length;
        const losses = playerStats.filter(s => !s.win).length;
        const totalPoints = playerStats.reduce((sum, s) => sum + s.points_scored, 0);
        const pointsAllowed = playerStats.reduce((sum, s) => sum + s.points_allowed, 0);
        const pointsDiff = totalPoints - pointsAllowed;
        const matchesPlayed = playerStats.length;
        const winPercentage = matchesPlayed > 0 ? wins / matchesPlayed : 0;

        standings.push({
            player,
            wins,
            losses,
            pointsDiff,
            totalPoints,
            matchesPlayed,
            winPercentage
        });
    }

    // Sort by wins, then points diff, then total points
    return standings.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
        return b.totalPoints - a.totalPoints;
    });
}

export function seedPlayersForNextRound(
    standings: IndividualStanding[]
): Player[] {
    return standings.map(s => s.player);
}
```

---

### Phase 6: Pairing Algorithm Implementation

#### 6.1 King & Queen Pairing Logic
**Update File**: `/src/lib/pairingGenerator.svelte.ts`

```typescript
export class PairingGenerator {
    /**
     * King & Queen pairing algorithm:
     * 1. Sort players by gender (kings and queens separate)
     * 2. Within each gender, sort by current standings
     * 3. Distribute top players across teams
     * 4. Create matches with balanced skill levels
     *
     * Supports flexible team sizes:
     * - 2v2: 1 king + 1 queen per team
     * - 4v4: 2 kings + 2 queens per team
     * - 6v6: 3 kings + 3 queens per team
     */
    async generateKingQueenPairings(
        players: Player[],
        eventId: number,
        round: number,
        standings: IndividualStanding[],
        teamSize: number = 2  // Total players per team (must be even)
    ): Promise<Team[]> {
        if (teamSize % 2 !== 0) {
            throw new Error('Team size must be even for King & Queen format');
        }

        const playersPerGender = teamSize / 2;

        // Separate by gender and sort by standings
        const kings = standings
            .filter(s => s.player.gender === 'male')
            .map(s => s.player);
        const queens = standings
            .filter(s => s.player.gender === 'female')
            .map(s => s.player);

        if (kings.length !== queens.length) {
            throw new Error('King & Queen requires equal male/female players');
        }

        if (kings.length % playersPerGender !== 0) {
            throw new Error(`Need ${playersPerGender} males per team`);
        }

        const teams: Team[] = [];
        let teamNum = 1;

        // Create teams with equal gender distribution
        for (let i = 0; i < kings.length; i += playersPerGender) {
            const team = new Team();
            team.event_id = eventId;
            team.is_temporary = true;
            team.round = round;
            team.team_size = teamSize;
            team.players = [];

            // Add kings to this team
            for (let j = 0; j < playersPerGender; j++) {
                if (i + j < kings.length) {
                    team.players.push(kings[i + j]);
                }
            }

            // Add queens to this team
            for (let j = 0; j < playersPerGender; j++) {
                if (i + j < queens.length) {
                    team.players.push(queens[i + j]);
                }
            }

            // Generate team name
            if (teamSize === 2) {
                team.name = `${team.players[0].name} & ${team.players[1].name}`;
            } else {
                team.name = `Round ${round} - Team ${teamNum++}`;
            }

            teams.push(team);
        }

        return teams;
    }

    /**
     * Example usage:
     *
     * 2v2 King & Queen:
     *   generateKingQueenPairings(..., teamSize: 2)
     *   → Team 1: King #1 + Queen #1
     *   → Team 2: King #2 + Queen #2
     *   → Match: Team 1 vs Team 2
     *
     * 6v6 King & Queen:
     *   generateKingQueenPairings(..., teamSize: 6)
     *   → Team 1: Kings #1,#2,#3 + Queens #1,#2,#3
     *   → Team 2: Kings #4,#5,#6 + Queens #4,#5,#6
     *   → Match: Team 1 vs Team 2
     */

    /**
     * Snake draft pairing for balanced matches
     * Works for any team size
     *
     * Algorithm:
     * - For 2v2: Pair 1-4, 2-3, 5-8, 6-7 (balanced)
     * - For 6v6: Group 1-6-7-12, 2-5-8-11, 3-4-9-10
     */
    async generateSnakeDraftPairings(
        players: Player[],
        eventId: number,
        round: number,
        standings: IndividualStanding[],
        teamSize: number = 2
    ): Promise<Team[]> {
        const sortedPlayers = standings.map(s => s.player);
        const teams: Team[] = [];
        const totalPlayers = sortedPlayers.length;

        if (totalPlayers % teamSize !== 0) {
            throw new Error(`Player count must be divisible by team size (${teamSize})`);
        }

        const numTeams = totalPlayers / teamSize;
        let teamNum = 1;

        // For 2v2: Simple snake draft
        if (teamSize === 2) {
            for (let i = 0; i < totalPlayers; i += 4) {
                if (i + 3 < totalPlayers) {
                    // Team 1: 1st and 4th (balanced)
                    const team1 = new Team();
                    team1.name = `Team ${teamNum++}`;
                    team1.event_id = eventId;
                    team1.is_temporary = true;
                    team1.round = round;
                    team1.team_size = teamSize;
                    team1.players = [sortedPlayers[i], sortedPlayers[i + 3]];
                    teams.push(team1);

                    // Team 2: 2nd and 3rd (balanced)
                    const team2 = new Team();
                    team2.name = `Team ${teamNum++}`;
                    team2.event_id = eventId;
                    team2.is_temporary = true;
                    team2.round = round;
                    team2.team_size = teamSize;
                    team2.players = [sortedPlayers[i + 1], sortedPlayers[i + 2]];
                    teams.push(team2);
                }
            }
        } else {
            // For larger teams: Distribute by rounds
            for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) {
                const team = new Team();
                team.name = `Team ${teamNum++}`;
                team.event_id = eventId;
                team.is_temporary = true;
                team.round = round;
                team.team_size = teamSize;
                team.players = [];

                // Snake pattern: pick players in alternating order
                for (let playerSlot = 0; playerSlot < teamSize; playerSlot++) {
                    const round = Math.floor(playerSlot / numTeams);
                    let pickIdx;

                    if (round % 2 === 0) {
                        // Forward: Team 0 picks first
                        pickIdx = round * numTeams + teamIdx;
                    } else {
                        // Reverse: Team N picks first
                        pickIdx = round * numTeams + (numTeams - 1 - teamIdx);
                    }

                    if (pickIdx < totalPlayers) {
                        team.players.push(sortedPlayers[pickIdx]);
                    }
                }

                teams.push(team);
            }
        }

        return teams;
    }

    /**
     * Example for 6v6 with 12 players:
     *   Team 1: Players 1, 12, 13, 24 (if 24 teams) or simplified
     *   Team 2: Players 2, 11, 14, 23
     *
     * This ensures top players are distributed evenly across teams
     */
}
```

---

### Phase 7: UI Components

#### 7.1 Player Management Component
**New File**: `/src/routes/events/[slug]/players/+page.svelte`
```svelte
<script lang="ts">
    import { Players } from '$lib/players.svelte';
    import { Player } from '$lib/player.svelte';

    let { data } = $props();
    let players = new Players();
    let newPlayerName = $state('');
    let newPlayerGender = $state('');

    async function addPlayer() {
        const player = new Player();
        player.name = newPlayerName;
        player.gender = newPlayerGender;
        player.event_id = data.event.id;
        await players.create(player);
        newPlayerName = '';
    }

    async function deletePlayer(id: number) {
        await players.delete(id);
    }
</script>

<div class="players-container">
    <h2>Players</h2>

    <form onsubmit={addPlayer}>
        <input bind:value={newPlayerName} placeholder="Player name" />
        <select bind:value={newPlayerGender}>
            <option value="male">Male</option>
            <option value="female">Female</option>
        </select>
        <button type="submit">Add Player</button>
    </form>

    <ul>
        {#each players.players as player}
            <li>
                {player.name} ({player.gender})
                <button onclick={() => deletePlayer(player.id)}>Delete</button>
            </li>
        {/each}
    </ul>
</div>
```

#### 7.2 Individual Standings Component
**New File**: `/src/routes/events/[slug]/individual-standings/+page.svelte`
```svelte
<script lang="ts">
    import { calculateIndividualStandings } from '$lib/individualStandings.svelte';

    let { data } = $props();
    let standings = $derived(calculateIndividualStandings(
        data.players.players,
        data.playerStats
    ));
</script>

<div class="standings">
    <h2>Individual Standings</h2>

    <table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Win %</th>
                <th>Points Diff</th>
                <th>Total Points</th>
            </tr>
        </thead>
        <tbody>
            {#each standings as standing, i}
                <tr>
                    <td>{i + 1}</td>
                    <td>{standing.player.name}</td>
                    <td>{standing.wins}</td>
                    <td>{standing.losses}</td>
                    <td>{(standing.winPercentage * 100).toFixed(1)}%</td>
                    <td>{standing.pointsDiff}</td>
                    <td>{standing.totalPoints}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
```

#### 7.3 Tournament Type Selector
**Modify File**: `/src/routes/events/[slug]/+page.svelte`

Add tournament type selection when creating event:
```svelte
<select bind:value={event.tournament_type}>
    <option value="fixed-teams">Fixed Teams</option>
    <option value="mix-and-match">Mix & Match</option>
    <option value="king-and-queen">King & Queen</option>
</select>
```

#### 7.4 Round Generator for Mix-and-Match
**New Component**: `/src/components/MixAndMatchRoundGenerator.svelte`
```svelte
<script lang="ts">
    import { PairingGenerator } from '$lib/pairingGenerator.svelte';

    let { event, players, standings } = $props();
    let pairingMethod = $state('balanced');
    let generator = new PairingGenerator();

    async function generateNextRound() {
        const nextRound = event.current_round + 1;

        let teams;
        if (event.tournament_type === 'king-and-queen') {
            teams = await generator.generateKingQueenPairings(
                players.players,
                event.id,
                nextRound,
                standings,
                matches.matches
            );
        } else {
            teams = await generator.generateMixAndMatchPairings(
                players.players,
                nextRound,
                pairingMethod
            );
        }

        // Save teams to database
        for (const team of teams) {
            await team.save();
        }

        // Create matches from teams
        await matches.generateRound(teams, nextRound);
    }
</script>

<button onclick={generateNextRound}>
    Generate Round {event.current_round + 1}
</button>

{#if event.tournament_type === 'mix-and-match'}
    <select bind:value={pairingMethod}>
        <option value="random">Random</option>
        <option value="balanced">Skill Balanced</option>
        <option value="snake">Snake Draft</option>
    </select>
{/if}
```

---

### Phase 8: Server-Side API Updates

#### 8.1 Add Player Management Actions
**New File**: `/src/routes/events/[slug]/players/+page.server.ts`
```typescript
import type { Actions } from './$types';
import { playerSchema } from '$lib/schemas/playerSchema';

export const actions: Actions = {
    createPlayer: async ({ request, locals }) => {
        const formData = await request.formData();
        const player = playerSchema.parse({
            name: formData.get('name'),
            event_id: Number(formData.get('event_id')),
            gender: formData.get('gender'),
            email: formData.get('email'),
        });

        const { data, error } = await locals.supabase
            .from('players')
            .insert(player)
            .select()
            .single();

        if (error) throw error;
        return { success: true, player: data };
    },

    deletePlayer: async ({ request, locals }) => {
        const formData = await request.formData();
        const playerId = Number(formData.get('player_id'));

        const { error } = await locals.supabase
            .from('players')
            .delete()
            .eq('id', playerId);

        if (error) throw error;
        return { success: true };
    }
};
```

#### 8.2 Update Match Completion Handler
**Modify File**: `/src/routes/events/[slug]/+page.server.ts`

Add player stats saving when match completes:
```typescript
export const actions: Actions = {
    // ... existing actions

    completeMatch: async ({ request, locals }) => {
        const formData = await request.formData();
        const matchId = Number(formData.get('match_id'));
        const team1Score = Number(formData.get('team1_score'));
        const team2Score = Number(formData.get('team2_score'));

        // Get match details with teams and players via junction table
        const { data: match } = await locals.supabase
            .from('matches')
            .select(`
                *,
                team1:teams!team1(
                    *,
                    player_teams(player_id)
                ),
                team2:teams!team2(
                    *,
                    player_teams(player_id)
                )
            `)
            .eq('id', matchId)
            .single();

        // Update match scores
        await locals.supabase
            .from('matches')
            .update({ team1_score, team2_score, state: 'COMPLETE' })
            .eq('id', matchId);

        // If tournament uses individual tracking, save player stats
        const { data: event } = await locals.supabase
            .from('events')
            .select('tournament_type')
            .eq('id', match.event_id)
            .single();

        if (event.tournament_type === 'mix-and-match' ||
            event.tournament_type === 'king-and-queen') {

            const team1Won = team1Score > team2Score;
            const playerStats = [];

            // Add stats for team1 players
            for (const pt of match.team1.player_teams) {
                playerStats.push({
                    player_id: pt.player_id,
                    event_id: match.event_id,
                    match_id: matchId,
                    points_scored: team1Score,
                    points_allowed: team2Score,
                    win: team1Won
                });
            }

            // Add stats for team2 players
            for (const pt of match.team2.player_teams) {
                playerStats.push({
                    player_id: pt.player_id,
                    event_id: match.event_id,
                    match_id: matchId,
                    points_scored: team2Score,
                    points_allowed: team1Score,
                    win: !team1Won
                });
            }

            if (playerStats.length > 0) {
                await locals.supabase
                    .from('player_stats')
                    .insert(playerStats);
            }
        }

        return { success: true };
    }
};
```

---

### Phase 9: Helper & Initialization Updates

#### 9.1 Update Helper to Load Players
**Modify File**: `/src/lib/helper.svelte.ts`

```typescript
import { Players } from './players.svelte';
import { PlayerStats } from './playerStats.svelte';

export async function initiateEvent(
    eventId: number | 'create',
    supabase: SupabaseClient
) {
    // ... existing code

    const players = new Players();
    const playerStats = new PlayerStats();

    if (eventId !== 'create') {
        await players.load(eventId);
        await playerStats.load(eventId);
    }

    return {
        tournament,
        matches,
        teams,
        bracket,
        players,      // NEW
        playerStats   // NEW
    };
}
```

---

### Phase 10: Types & Database Type Updates

#### 10.1 Add Database Types
**Modify File**: `/src/types/database.ts`

```typescript
export interface PlayerRow {
    id: number;
    created_at: string;
    name: string;
    event_id: number;
    email?: string;
    phone?: string;
    gender?: string;
    skill_level?: number;
    state: string;
}

export interface PlayerStatsRow {
    id: number;
    player_id: number;
    event_id: number;
    match_id: number;
    points_scored: number;
    points_allowed: number;
    win: boolean;
}

export interface PlayerTeamRow {
    id: number;
    player_id: number;
    team_id: number;
    position?: string;
    created_at: string;
}

export interface EventRow {
    // ... existing fields
    tournament_type: 'fixed-teams' | 'mix-and-match' | 'king-and-queen';
    team_size?: number;  // Default: 2 (doubles), can be 3, 4, 6, etc.
}

export interface TeamRow {
    // ... existing fields
    is_temporary?: boolean;
    round?: number;
    team_size?: number;
}
```

---

## Implementation Phases & Order

### Phase 1: Foundation (Database & Models)
1. Create database migration with new tables
2. Run migration on Supabase
3. Create Player, Players, PlayerStats models
4. Create database services for players
5. Create schemas and validation
6. Update types

**Estimated Time**: 1-2 days

### Phase 2: Core Logic (Standings & Pairing)
1. Implement individual standings calculation
2. Create pairing generator with algorithms
3. Update match completion to save player stats
4. Test pairing algorithms

**Estimated Time**: 2-3 days

### Phase 3: UI Components
1. Create player management UI
2. Create individual standings view
3. Add tournament type selector to event creation
4. Create round generator component
5. Update match display to show player names

**Estimated Time**: 2-3 days

### Phase 4: Integration & Testing
1. Update helper.svelte.ts initialization
2. Wire up all components
3. Test complete workflow:
   - Create mix-and-match tournament
   - Add players
   - Generate round with pairings
   - Play matches
   - View individual standings
   - Generate next round
4. Test king & queen workflow

**Estimated Time**: 2-3 days

### Phase 5: Polish & Edge Cases
1. Handle odd number of players (byes)
2. Add player withdrawal feature
3. Add manual pairing override
4. Improve pairing algorithms (avoid repeat partners)
5. Add CSV import for players
6. Add player stats export

**Estimated Time**: 1-2 days

**Total Estimated Time**: 1.5-2 weeks

---

## Key Design Decisions

### 1. Player vs Team Relationship
**Decision**: Use a `player_teams` junction table (many-to-many relationship)
**Rationale**:
- **Flexible team sizes**: Supports 2v2 (beach doubles), 3v3 (grass), 4v4, 6v6 (indoor), and any other configuration
- **Future-proof**: Can handle King & Queen with 6-player teams, or any other variant
- **Standard pattern**: Well-established database design for many-to-many relationships
- **Excellent tooling**: Supabase nested queries make this trivial: `teams!team1(*, player_teams(player_id))`
- **Same player, different teams**: Naturally supports players rotating between teams across rounds
- **Optional metadata**: Can track position/role per player-team pairing if needed

### 2. Temporary Teams
**Decision**: Generate new teams each round and mark them as temporary
**Rationale**:
- Reuses existing matches infrastructure
- Clear distinction between fixed and rotating teams
- Easy to clean up after tournament

### 3. Individual Stats Tracking
**Decision**: Create separate `player_stats` table
**Rationale**:
- Denormalized for fast standings calculation
- Can aggregate per player across all matches
- Maintains history even if teams are deleted

### 4. Tournament Type Field
**Decision**: Add enum to events table
**Rationale**:
- Single source of truth for tournament behavior
- Easy to check what rules to apply
- Extensible for future tournament types

---

## Migration Path for Existing Users

### Option 1: Separate Feature (Recommended)
- Existing tournaments continue as "fixed-teams" type
- New tournaments can choose tournament type
- No changes to existing data
- Zero migration risk

### Option 2: Backfill Existing Data
- Add migration to set all existing events to "fixed-teams"
- Optionally create player records from team names
- Higher risk, more complex

**Recommendation**: Use Option 1 for safety and simplicity

---

## Testing Checklist

### Unit Tests
- [ ] Player model validation
- [ ] PlayerStats calculations
- [ ] Pairing algorithms (snake draft, king/queen)
- [ ] Individual standings sort order
- [ ] Partner history tracking

### Integration Tests
- [ ] Create player via API
- [ ] Generate king & queen pairings
- [ ] Complete match and verify player stats saved
- [ ] Calculate standings after multiple rounds
- [ ] Generate subsequent rounds with proper seeding

### E2E Tests
- [ ] Full king & queen tournament workflow
- [ ] Full mix-and-match tournament workflow
- [ ] Player CRUD operations
- [ ] Individual standings display
- [ ] Handle odd number of players

---

## Potential Enhancements (Future)

1. **Advanced Pairing Algorithms**
   - Swiss system pairing
   - Round-robin rotation schedules
   - Skill-based matchmaking
   - Court optimization

2. **Partner Constraints**
   - Block certain player combinations
   - Prefer certain partnerships
   - Mandatory partner variety before repeats

3. **Player Profiles**
   - Photos
   - Stats history across tournaments
   - Skill ratings that update
   - Win/loss records

4. **Real-time Leaderboard**
   - Live updating individual standings
   - Projected final rankings
   - Performance trends

5. **Export & Reporting**
   - CSV export of player stats
   - Printable brackets with player names
   - Tournament summary reports
   - Email results to players

---

## Files to Create/Modify Summary

### New Files (17):
1. `/supabase/migrations/[timestamp]_add_mix_and_match_support.sql`
2. `/src/lib/player.svelte.ts`
3. `/src/lib/players.svelte.ts`
4. `/src/lib/playerStats.svelte.ts`
5. `/src/lib/pairingGenerator.svelte.ts`
6. `/src/lib/individualStandings.svelte.ts`
7. `/src/lib/database/player.ts`
8. `/src/lib/database/players.ts`
9. `/src/lib/database/playerStats.ts`
10. `/src/schemas/playerSchema.ts`
11. `/src/schemas/playerStatsSchema.ts`
12. `/src/routes/events/[slug]/players/+page.svelte`
13. `/src/routes/events/[slug]/players/+page.server.ts`
14. `/src/routes/events/[slug]/individual-standings/+page.svelte`
15. `/src/components/MixAndMatchRoundGenerator.svelte`
16. `/src/components/PlayerManagement.svelte`
17. `/src/components/IndividualStandings.svelte`

### Modified Files (8):
1. `/src/lib/team.svelte.ts`
2. `/src/lib/database/match.ts`
3. `/src/schemas/eventSchema.ts`
4. `/src/lib/helper.svelte.ts`
5. `/src/types/database.ts`
6. `/src/routes/events/[slug]/+page.svelte`
7. `/src/routes/events/[slug]/+page.server.ts`
8. `/src/lib/event.svelte.ts`

---

## Questions to Answer Before Implementation

1. **Player Registration**: Should players self-register or only admins add them?
2. **Team Size Configuration**: Should team size be set at tournament creation or per-round? (e.g., can you switch between 2v2 and 6v6?)
3. **Gender Requirements**: Is gender required for all mix-and-match, or only king/queen?
4. **Pairing Default**: What should be the default pairing algorithm?
5. **Round Management**: Should rounds be auto-generated or manual?
6. **Partner Repeats**: How many rounds before partners can repeat?
7. **Skill Levels**: Do we need skill-based seeding initially or use random?
8. **Court Assignment**: Should pairing algorithm consider court availability?
9. **Byes**: How to handle odd player counts - sit out rotates by standings?
10. **Position Tracking**: For 6v6, should we track player positions (setter, outside, etc.)?

---

## Success Criteria

### Must Have:
- ✅ Players can be added to tournaments
- ✅ Individual wins/losses tracked per player
- ✅ Individual standings calculated correctly
- ✅ King & Queen pairing generates male/female pairs (works for 2v2, 4v4, 6v6)
- ✅ Mix-and-match generates balanced teams (any team size)
- ✅ Subsequent rounds seed by individual performance
- ✅ Existing fixed-team tournaments unaffected
- ✅ Support for flexible team sizes (2, 3, 4, 6 players per team)

### Nice to Have:
- Partner history avoids repeats
- CSV import for players
- Skill-based pairing
- Player withdrawal mid-tournament
- Manual pairing override
- Printable individual standings

### Metrics:
- All unit tests pass
- E2E test completes full tournament
- Performance: <500ms to calculate standings for 100 players
- Zero breaking changes to existing tournaments
