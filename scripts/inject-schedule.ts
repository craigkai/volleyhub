/**
 * Script to inject a predefined schedule into an existing event
 *
 * Usage:
 * 1. Update the TEAM_MAPPING with your actual team names
 * 2. Update EVENT_ID with your event ID
 * 3. Run: npx tsx scripts/inject-schedule.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration
const EVENT_ID = 47;

// Map schedule team numbers to actual team names in your event
const TEAM_MAPPING: Record<number, string> = {
	1: 'Eric S',
	2: 'Tripp S',
	3: 'Ariel P',
	4: 'Nick M',
	5: 'Christopher C',
	6: 'Becca S',
	7: 'Luke L',
	8: 'Reed T',
	9: 'Amy A',
	10: 'Craig K',
	11: 'Ian Y',
	12: 'William M'
};

// The schedule to inject (12 players, 3v3, 10 rounds)
// Each round has one match since the UI only supports one court
const SCHEDULE = [
	// Round 0
	{ round: 0, court: 0, home: [1, 5, 12], away: [2, 6, 9] },
	// Round 1
	{ round: 1, court: 0, home: [3, 7, 10], away: [4, 8, 11] },
	// Round 2
	{ round: 2, court: 0, home: [4, 7, 9], away: [1, 8, 10] },
	// Round 3
	{ round: 3, court: 0, home: [2, 5, 11], away: [3, 6, 12] },
	// Round 4
	{ round: 4, court: 0, home: [3, 5, 10], away: [4, 6, 11] },
	// Round 5
	{ round: 5, court: 0, home: [1, 7, 12], away: [2, 8, 9] },
	// Round 6
	{ round: 6, court: 0, home: [1, 6, 10], away: [2, 7, 11] },
	// Round 7
	{ round: 7, court: 0, home: [3, 8, 12], away: [4, 5, 9] },
	// Round 8
	{ round: 8, court: 0, home: [3, 4, 5], away: [6, 7, 8] },
	// Round 9
	{ round: 9, court: 0, home: [1, 9, 11], away: [2, 10, 12] }
];

async function main() {
	// Validate configuration
	if (EVENT_ID === 0) {
		console.error('❌ Please set EVENT_ID in the script');
		process.exit(1);
	}

	// Check if team mapping is updated
	if (TEAM_MAPPING[1] === 'Team Name 1') {
		console.error('❌ Please update TEAM_MAPPING with actual team names');
		process.exit(1);
	}

	// Initialize Supabase client
	const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseServiceKey) {
		console.error('❌ Missing Supabase credentials in .env');
		console.error('Required: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
		process.exit(1);
	}

	const supabase = createClient(supabaseUrl, supabaseServiceKey);

	console.log('🔍 Looking up teams...');

	// Fetch all teams for this event
	const { data: teams, error: teamsError } = await supabase
		.from('teams')
		.select('id, name')
		.eq('event_id', EVENT_ID);

	if (teamsError) {
		console.error('❌ Error fetching teams:', teamsError);
		process.exit(1);
	}

	if (!teams || teams.length === 0) {
		console.error('❌ No teams found for event', EVENT_ID);
		process.exit(1);
	}

	console.log(`✅ Found ${teams.length} teams`);

	// Create mapping from schedule number to actual team ID
	const teamIdMap: Record<number, number> = {};
	for (const [scheduleNum, teamName] of Object.entries(TEAM_MAPPING)) {
		const team = teams.find(t => t.name === teamName);
		if (!team) {
			console.error(`❌ Team not found: "${teamName}" (schedule #${scheduleNum})`);
			console.log('Available teams:', teams.map(t => t.name).join(', '));
			process.exit(1);
		}
		teamIdMap[parseInt(scheduleNum)] = team.id;
	}

	console.log('✅ All teams mapped successfully');

	// Delete existing matches for this event
	console.log('🗑️  Deleting existing matches...');
	const { error: deleteError } = await supabase
		.from('matches')
		.delete()
		.eq('event_id', EVENT_ID)
		.eq('type', 'pool');

	if (deleteError) {
		console.error('❌ Error deleting existing matches:', deleteError);
		process.exit(1);
	}

	console.log('✅ Existing matches deleted');

	// Create matches
	console.log('📝 Creating matches...');
	const matchesToCreate = SCHEDULE.map((game) => ({
		event_id: EVENT_ID,
		round: game.round,
		court: game.court,
		team1: teamIdMap[game.home[0]], // First player on home side
		team2: teamIdMap[game.away[0]], // First player on away side
		ref: null, // Set to null, can be updated later
		type: 'pool',
		state: 'INCOMPLETE'
	}));

	const { data: createdMatches, error: matchesError } = await supabase
		.from('matches')
		.insert(matchesToCreate)
		.select('id');

	if (matchesError) {
		console.error('❌ Error creating matches:', matchesError);
		process.exit(1);
	}

	if (!createdMatches || createdMatches.length === 0) {
		console.error('❌ No matches created');
		process.exit(1);
	}

	console.log(`✅ Created ${createdMatches.length} matches`);

	// Create match_teams entries
	console.log('📝 Creating match_teams entries...');
	const matchTeamsToCreate: Array<{
		match_id: number;
		team_id: number;
		side: 'home' | 'away';
	}> = [];

	createdMatches.forEach((match, index) => {
		const game = SCHEDULE[index];

		// Add home team players
		game.home.forEach((scheduleNum) => {
			matchTeamsToCreate.push({
				match_id: match.id,
				team_id: teamIdMap[scheduleNum],
				side: 'home'
			});
		});

		// Add away team players
		game.away.forEach((scheduleNum) => {
			matchTeamsToCreate.push({
				match_id: match.id,
				team_id: teamIdMap[scheduleNum],
				side: 'away'
			});
		});
	});

	const { error: matchTeamsError } = await supabase
		.from('match_teams')
		.insert(matchTeamsToCreate);

	if (matchTeamsError) {
		console.error('❌ Error creating match_teams:', matchTeamsError);
		process.exit(1);
	}

	console.log(`✅ Created ${matchTeamsToCreate.length} match_teams entries`);

	// Summary
	console.log('\n✨ Schedule injection complete!');
	console.log(`   Event ID: ${EVENT_ID}`);
	console.log(`   Matches: ${createdMatches.length}`);
	console.log(`   Rounds: 10 (0-9)`);
	console.log(`   Courts: 1`);
	console.log(`   Format: 3v3`);
}

main().catch((error) => {
	console.error('❌ Unexpected error:', error);
	process.exit(1);
});
