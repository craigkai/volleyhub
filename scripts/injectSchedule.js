/**
 * Use this script if you want to import a CSV schedule into your Supabase database.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseKey = '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getTeamIdMapping(eventId) {
	const { data: teams, error } = await supabase
		.from('teams') // Assuming the team information is stored in a 'teams' table
		.select('id, name')
		.eq('event_id', eventId);

	if (error) {
		console.error('Error fetching teams:', error);
		return null;
	}

	// Create a mapping from team names to IDs
	const teamIdMapping = {};
	teams.forEach((team) => {
		teamIdMapping[team.name] = team.id;
	});

	return teamIdMapping;
}

async function deleteMatchesByEvent(eventId) {
	const { error } = await supabase.from('matches').delete().eq('event_id', eventId);

	if (error) {
		console.error('Error deleting matches:', error);
	} else {
		console.log(`Matches for event ${eventId} deleted successfully.`);
	}
}

async function insertMatches(eventId, schedule, teamIdMapping) {
	for (let roundNumber = 0; roundNumber < schedule.length; roundNumber++) {
		const round = schedule[roundNumber];

		for (let i = 0; i < round.matches.length; i++) {
			const [team1Name, team2Name, refName] = round.matches[i];
			const team1 = teamIdMapping[team1Name];
			const team2 = teamIdMapping[team2Name];
			const ref = teamIdMapping[refName];

			if (!team1 || !team2) continue; // Skip the bye matches

			const matchData = {
				event_id: eventId,
				round: roundNumber + 1, // Assuming the round starts from 1
				court: 0, // Assuming one court
				team1: team1,
				team2: team2,
				team1_score: null,
				team2_score: null,
				ref: ref
			};

			const { error } = await supabase.from('matches').insert(matchData);

			if (error) {
				console.error(`Error inserting match: Round ${roundNumber + 1}`, error);
			}
		}
	}

	console.log('Matches inserted successfully.');
}

(async () => {
	const eventId = -1; // Replace with your event ID

	// Define your schedule as an array of rounds
	const schedule = [
		{ matches: [['1', '5', '6']] },
		{ matches: [['6', '4', '5']] },
		{ matches: [['2', '3', '4']] },
		{ matches: [['1', '6', '3']] },
		{ matches: [['5', '4', '2']] },
		{ matches: [['1', '2', '6']] },
		{ matches: [['6', '3', '1']] },
		{ matches: [['5', '2', '4']] },
		{ matches: [['1', '4', '2']] },
		{ matches: [['5', '3', '6']] },
		{ matches: [['6', '2', '5']] },
		{ matches: [['1', '3', '4']] },
		{ matches: [['4', '2', '3']] },
		{ matches: [['5', '6', '2']] },
		{ matches: [['4', '3', '1']] }
	];

	// Fetch team ID mappings
	const teamIdMapping = await getTeamIdMapping(eventId);

	if (teamIdMapping) {
		// Delete existing matches for the event
		await deleteMatchesByEvent(eventId);

		// Insert the new matches
		await insertMatches(eventId, schedule, teamIdMapping);
	}
})();
