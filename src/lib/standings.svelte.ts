import type { Team } from './team.svelte';
import type { Match } from './match.svelte';

export function findStandings(matches: Match[], teams: Team[]): TeamScores {
	const teamScores: TeamScores = teams.reduce((acc: TeamScores, team: Team) => {
		if (team.name) acc[team.name] = { wins: 0, pointsDiff: 0 };
		return acc;
	}, {});

	matches.forEach((match: Match) => {
		const team1 = teams.find((t: Team) => t.id === match.team1);
		const team2 = teams.find((t: Team) => t.id === match.team2);
		if (!team1 || !team2 || !team1.name || !team2.name) {
			console.warn(`Match ${match.id} has invalid team IDs`);
			return;
		}

		if (match.team1_score !== null && match.team2_score !== null) {
			// Determine the winner and update wins
			if (
				match.team1_score !== undefined &&
				match.team2_score !== undefined &&
				match.team1_score > match.team2_score
			) {
				teamScores[team1.name].wins += 1;
			} else if (match.team2_score !== undefined && match.team2_score > (match.team1_score ?? 0)) {
				teamScores[team2.name].wins += 1;
			}

			// Calculate and update the points differential for both teams
			teamScores[team1.name].pointsDiff += (match.team1_score ?? 0) - (match.team2_score ?? 0);
			teamScores[team2.name].pointsDiff += (match.team2_score ?? 0) - (match.team1_score ?? 0);
		}
	});

	return teamScores;
}
