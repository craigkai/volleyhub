# Unified Team Model Refactor Plan

## Current Status: IN PROGRESS

### ✅ Completed

1. Database schema updated (match_teams table added, players tables removed)
2. Migration applied successfully
3. TypeScript types and Zod schemas updated
4. MatchTeamsSupabaseDatabaseService created

### 🔄 In Progress

#### Key Changes Needed:

1. **Remove `tournament_type` references** - Column no longer exists
   - Use `team_size` to determine format:
     - `team_size = 1` → Individual format (like mix-and-match)
     - `team_size > 1` → Fixed teams format

2. **Simplify Match Generation** - No more temporary teams!
   - For individual format: Teams already exist as 1-person teams
   - Just use pairing logic to group teams into home/away sides
   - Create match_teams entries instead of setting team1/team2

3. **Remove Player Classes** - Use Teams for everything
   - Delete: `src/lib/players.svelte.ts`
   - Delete: `src/lib/player.svelte.ts`
   - Delete: `src/lib/database/players.ts`
   - Delete: `src/lib/database/player.ts`
   - Delete: `src/schemas/playerSchema.ts`
   - Update: `src/components/Players.svelte` → Create 1-person teams

4. **Update Pairing Generators**
   - Change from `Player[]` to `Team[]`
   - Return arrays of teams for home/away sides
   - Remove player-specific logic

5. **Update Match Creation**
   - Remove team1/team2 assignment (keep for backward compat but deprecated)
   - Add match_teams entries for home/away sides
   - Update createConsecutivePairings to create match_teams

6. **Update UI Components**
   - Display: "Alice & Bob & Carol vs Dan & Eve & Frank"
   - Show arrays of teams per match
   - Update match display logic

### Testing Checklist

- [ ] Fixed teams 2v2 (multi-person teams)
- [ ] Individual 2v2 (1-person teams)
- [ ] Individual 3v3 (1-person teams)
- [ ] Individual 4v4 (1-person teams)
- [ ] Verify player cannot appear on both sides (database constraint)
- [ ] Match display shows all teams correctly
- [ ] Standings work for both formats
