import { Event } from '$lib/event.svelte';
import type { Team } from './team.svelte';
import type { Match } from './match.svelte';

export function findStandings(matches: Match[], event: Event, teams: Team[]): TeamScores {
	const teamScores: TeamScores = teams.reduce((acc: TeamScores, team: Team) => {
		if (team.name) acc[team.name] = 0;
		return acc;
	}, {});

	matches.forEach((match: Match) => {
		const team1 = $state.snapshot(teams).find((t: Team) => t.id === match.team1);
		const team2 = $state.snapshot(teams).find((t: Team) => t.id === match.team2);
		if (!team1 || !team2 || !team1.name || !team2.name) {
			console.warn(`Match ${match.id} has invalid team IDs`);
			return teamScores;
		}

		if (match.team1_score && match.team2_score) {
			if (!teamScores[team1.name]) {
				teamScores[team1.name] = 0;
			}

			if (!teamScores[team2.name]) {
				teamScores[team2.name] = 0;
			}

			if (event?.scoring === 'points') {
				teamScores[team1.name] += match?.team1_score || 0;
				teamScores[team2.name] += match?.team2_score || 0;
			} else {
				teamScores[team1.name] += match.team1_score > match.team2_score ? 1 : 0;
				teamScores[team2.name] += match.team2_score > match.team1_score ? 1 : 0;
			}
		}
	});

	return teamScores;
}
