# Implementation Guide: Unified Team Model

##Summary

You asked about the bug where "the same player can end up playing itself in 3v3s". We've restructured the database to use a **unified team model** that makes this bug **impossible** at the database level.

## What We've Done ✅

### 1. Database Changes (COMPLETED)

- Created `match_teams` junction table linking matches to teams
- **Key constraint**: `UNIQUE(match_id, team_id)` prevents same team/player on both sides
- Removed `players`, `player_teams`, `player_stats` tables
- Removed `is_temporary`, `round` from teams
- Removed `tournament_type` from events
- Migration: `/supabase/migrations/20251105000002_unified_team_model.sql`

### 2. TypeScript & Services (COMPLETED)

- Generated new types from database
- Created `MatchTeamsSupabaseDatabaseService`
- Updated Zod schemas

## What Needs Implementation 🔧

### Key Concept Changes

**OLD WAY (Mix-and-Match):**

```
1. User adds "Alice" → creates Player row
2. Generate matches → creates temporary Team rows
3. Links players to teams via player_teams
4. Creates matches with team1/team2
❌ BUG: Same player could appear in multiple teams in same match
```

**NEW WAY (Unified):**

```
1. User adds "Alice" → creates Team row (name="Alice", team_size=1)
2. Generate matches → groups existing teams
3. Creates match_teams entries (match_id, team_id, side: 'home'|'away')
✅ DATABASE CONSTRAINT: Same team cannot appear twice in same match
```

---

## Implementation Steps

### Step 1: Update Event Format Detection

**File**: Throughout codebase
**Change**: Replace `tournament_type === 'mix-and-match'` with team_size check

```typescript
// OLD
if (tournament_type === 'mix-and-match') { ... }

// NEW
const isIndividualFormat = (event.team_size ?? 2) === 1;
if (isIndividualFormat) { ... }
```

### Step 2: Remove Player Classes

**Files to DELETE:**

- `src/lib/players.svelte.ts`
- `src/lib/player.svelte.ts`
- `src/lib/database/players.ts`
- `src/lib/database/player.ts`
- `src/lib/database/playerTeams.ts`
- `src/schemas/playerSchema.ts`

### Step 3: Update Players UI Component

**File**: `src/components/Players.svelte`

```typescript
// Change from creating players to creating 1-person teams

async function addPlayer(name: string) {
	// OLD
	await data.players.create({ name, event_id: eventId });

	// NEW
	await data.teams.create({
		name,
		event_id: eventId,
		team_size: 1 // This marks it as a "player" team
	});
}
```

### Step 4: Update Pairing Generators

**File**: `src/lib/pairingGenerator.svelte.ts`

Remove Player references, work with Teams:

```typescript
// OLD signature
async generateSnakeDraftPairings(
  players: Player[],
  eventId: number,
  round: number,
  standings: IndividualStanding[],
  teamSize: number = 2
): Promise<Partial<TeamRow>[]>

// NEW signature
async generateSnakeDraftPairings(
  teams: Team[],
  teamSize: number,
  numTeamsPerSide: number
): Promise<{ homeTeams: number[], awayTeams: number[] }[]>

// For 3v3 with 1-person teams:
// teams = [Alice, Bob, Carol, Dan, Eve, Frank]
// numTeamsPerSide = 3
// Returns: [
//   { homeTeams: [1,4,5], awayTeams: [2,3,6] }  // Match 1
// ]
```

### Step 5: Update Match Creation Logic

**File**: `src/lib/matches.svelte.ts`

Major changes to `create()` method:

```typescript
async create(
  { pools = 0, courts, refs = 'provided', team_size }: Event | Partial<EventRow>,
  teams: Team[]
): Promise<Matches | undefined> {
  if (!this.event_id) {
    this.handleError(400, 'Event ID is required to create matches.');
    return;
  }

  try {
    await this.databaseService.deleteMatchesByEvent(this.event_id);

    const isIndividualFormat = (team_size ?? 2) === 1;
    let matchPairings: Array<{homeTeams: number[], awayTeams: number[]}>;

    if (isIndividualFormat) {
      // Individual format: use pairing algorithm to group 1-person teams
      const numTeamsPerSide = team_size || 2;  // e.g., 3 for 3v3
      matchPairings = await this.generateIndividualFormatPairings(
        teams,
        numTeamsPerSide,
        courts,
        pools
      );
    } else {
      // Fixed teams: use round-robin
      matchPairings = await this.generateFixedTeamsPairings(
        teams,
        courts,
        pools
      );
    }

    // Create matches and match_teams entries
    const res = await this.createMatchesWithTeams(matchPairings, courts, refs);

    // Load created matches
    const matchInstances: Match[] = [];
    if (res) {
      for (let i = 0; i < res.length; i++) {
        let match = new Match(matchSupabaseDatabaseService);
        matchInstances.push(Object.assign(match, res[i]));
      }
      this.matches = matchInstances;
    }

    return this;
  } catch (err) {
    this.handleError(500, err instanceof Error ? err.message : (err as string));
  }
}

// NEW method
private async createMatchesWithTeams(
  pairings: Array<{homeTeams: number[], awayTeams: number[]}>,
  courts: number,
  refs: string
): Promise<MatchRow[]> {
  const matches: Partial<MatchRow>[] = [];
  const matchTeamsToCreate: Partial<MatchTeamRow>[] = [];

  pairings.forEach((pairing, index) => {
    const round = Math.floor(index / courts) + 1;
    const court = index % courts;

    // Create match (without team1/team2 for new format)
    matches.push({
      event_id: this.event_id,
      round,
      court,
      ref: refs === 'provided' ? null : undefined,
      // Keep team1/team2 null - deprecated but kept for backward compat
      team1: null,
      team2: null
    });
  });

  // Insert matches first
  const createdMatches = await this.databaseService.insertMatches(matches);

  // Then create match_teams entries
  if (createdMatches) {
    createdMatches.forEach((match, index) => {
      const pairing = pairings[index];

      // Add home teams
      pairing.homeTeams.forEach(teamId => {
        matchTeamsToCreate.push({
          match_id: match.id,
          team_id: teamId,
          side: 'home'
        });
      });

      // Add away teams
      pairing.awayTeams.forEach(teamId => {
        matchTeamsToCreate.push({
          match_id: match.id,
          team_id: teamId,
          side: 'away'
        });
      });
    });

    // Bulk insert match_teams
    const matchTeamsService = new MatchTeamsSupabaseDatabaseService(
      this.databaseService.supabaseClient
    );
    await matchTeamsService.createMany(matchTeamsToCreate);
  }

  return createdMatches || [];
}
```

### Step 6: Update Matches.svelte Component

**File**: `src/components/Matches.svelte`

Simplify the generateMatches function:

```typescript
async function generateMatches(): Promise<void> {
	try {
		loading = true;
		if (matchesSubscription) {
			await matchesSubscription.unsubscribe();
			matchesSubscription = undefined;
		}

		// Check we have teams (whether 1-person or multi-person)
		if (data.teams.teams.length < 2) {
			const teamCount = data.teams.teams.length;
			const message =
				teamCount === 0
					? 'No teams found. Please add teams or players before generating matches.'
					: `Only ${teamCount} team found. Need at least 2 to generate matches.`;
			toast.error(message);
			return;
		}

		// Just pass all teams to match creation
		// The Matches class will handle individual vs fixed format
		const res = await data.matches.create(data.tournament, data.teams.teams);

		if (!res) {
			toast.error('Failed to create matches');
			return;
		}

		await subscribe();
		toast.success('Matches generated successfully');
	} catch (err: unknown) {
		console.error('Match generation failed:', err);
		const errorMessage =
			err instanceof Error ? err.message : 'Failed to generate matches. Please try again.';
		toast.error(errorMessage);
	} finally {
		showGenerateMatchesAlert = false;
		loading = false;
	}
}
```

**Remove all this complexity:**

- Player-related checks (lines 186-194)
- Temporary team creation/cleanup (lines 209-299)
- Rotation logic (lines 304-388)
- player_teams creation

### Step 7: Update Match Display

**File**: `src/components/Match.svelte` (and wherever matches are displayed)

```typescript
// Load match teams for display
const { data: matchTeams } = await supabase
	.from('match_teams')
	.select(
		`
    *,
    team:teams(id, name)
  `
	)
	.eq('match_id', match.id);

const homeTeams = matchTeams.filter((mt) => mt.side === 'home').map((mt) => mt.team);

const awayTeams = matchTeams.filter((mt) => mt.side === 'away').map((mt) => mt.team);

// Display
const homeDisplay = homeTeams.map((t) => t.name).join(' & ');
const awayDisplay = awayTeams.map((t) => t.name).join(' & ');

// Shows: "Alice & Bob & Carol vs Dan & Eve & Frank"
```

### Step 8: Update Individual Standings

**File**: `src/lib/individualStandings.svelte.ts`

```typescript
// Change from Player-based to Team-based
// For team_size=1, standings are per 1-person team

export function calculateIndividualStandings(
	teams: Team[], // Changed from players: Player[]
	playerStats: PlayerStatsRow[] // This table is deleted, need to calculate from matches
): IndividualStanding[] {
	// Calculate from match_teams and match results
	// Group by team_id, calculate wins/losses/points
}
```

---

## Testing Scenarios

### Scenario 1: Individual 3v3

1. Create event with team_size=1
2. Add 6 "players" (creates 6 teams with team_size=1)
3. Generate matches
4. Verify:
   - Creates match_teams entries
   - Each match has 3 teams on home, 3 on away
   - **No team appears twice** (database prevents it!)
   - Display shows: "Alice & Bob & Carol vs Dan & Eve & Frank"

### Scenario 2: Fixed 2v2

1. Create event with team_size=2
2. Add 4 teams manually
3. Generate matches
4. Verify round-robin schedule

### Scenario 3: The Original Bug

1. Try to manually insert: `INSERT INTO match_teams (match_id, team_id, side) VALUES (1, 5, 'home'), (1, 5, 'away')`
2. **Should FAIL** with unique constraint violation
3. This proves the bug is impossible

---

## Summary

The new model eliminates the distinction between "players" and "teams" at the database level:

- Everything is a team
- 1-person teams represent individual players
- match_teams junction table with UNIQUE constraint makes the bug impossible
- Simpler, more flexible, and safer
