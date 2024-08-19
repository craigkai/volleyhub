import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bduwlmhqcuslxxozwnjs.supabase.co';
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

const schedule = [
	{
		round: 1,
		matches: [
			[151, 160],
			[152, 159],
			[153, 158],
			[154, 157],
			[155, 156],
			[173, null]
		]
	},
	{
		round: 2,
		matches: [
			[156, 154],
			[157, 152],
			[158, 153],
			[159, 151],
			[160, 173],
			[155, null]
		]
	},
	{
		round: 3,
		matches: [
			[151, 155],
			[152, 160],
			[153, 159],
			[154, 158],
			[173, 157],
			[156, null]
		]
	},
	{
		round: 4,
		matches: [
			[151, 157],
			[152, 158],
			[153, 160],
			[154, 159],
			[155, 173],
			[151, null]
		]
	},
	{
		round: 5,
		matches: [
			[151, 153],
			[152, 173],
			[154, 160],
			[155, 159],
			[156, 158],
			[157, null]
		]
	},
	{
		round: 6,
		matches: [
			[152, 156],
			[153, 157],
			[154, 151],
			[155, 160],
			[158, 173],
			[159, null]
		]
	},
	{
		round: 7,
		matches: [
			[151, 154],
			[153, 159],
			[155, 157],
			[156, 173],
			[158, 160],
			[152, null]
		]
	},
	{
		round: 8,
		matches: [
			[151, 158],
			[152, 155],
			[153, 160],
			[154, 173],
			[157, 159],
			[156, null]
		]
	},
	{
		round: 9,
		matches: [
			[153, 173],
			[154, 156],
			[155, 158],
			[157, 160],
			[151, 159],
			[152, null]
		]
	},
	{
		round: 10,
		matches: [
			[151, 157],
			[152, 159],
			[153, 154],
			[155, 156],
			[160, 173],
			[155, null]
		]
	},
	{
		round: 11,
		matches: [
			[151, 154],
			[152, 155],
			[153, 156],
			[157, 160],
			[158, 173],
			[159, null]
		]
	}
];

async function insertMatches(schedule) {
	for (let round of schedule) {
		const { round: roundNumber, matches } = round;

		for (let i = 0; i < matches.length; i++) {
			const [team1, team2] = matches[i];
			if (!team1 || !team2) continue; // Skip the bye matches

			const court = (i % 3) + 1; // Distribute matches across 3 courts
			const matchData = {
				event_id: 16,
				round: roundNumber,
				court: court,
				team1: team1,
				team2: team2,
				team1_score: null,
				team2_score: null,
				ref: null // You can assign referees here if needed
			};

			const { error } = await supabase.from('matches').insert(matchData);

			if (error) {
				console.error(`Error inserting match: Round ${roundNumber}, Court ${court}`, error);
			}
		}
	}

	console.log('Matches inserted successfully.');
}

insertMatches(schedule);
