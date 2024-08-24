import type { Team } from './team.svelte';
import type { Match } from './match.svelte';

export function findStandings(
	matches: Match[],
	teams: Team[]
): {
	name: string;
	wins: number;
	pointsDiff: number;
	headToHeadWins: Record<string, number>;
	totalPoints: number;
}[] {
	const teamScores: TeamScores = teams.reduce((acc: TeamScores, team: Team) => {
		if (team.name) acc[team.name] = { wins: 0, pointsDiff: 0, headToHeadWins: {}, totalPoints: 0 };
		return acc;
	}, {});

	// First pass to calculate wins, points differential, and head-to-head results
	matches.forEach((match: Match) => {
		const team1 = teams.find((t: Team) => t.id === match.team1);
		const team2 = teams.find((t: Team) => t.id === match.team2);
		if (!team1 || !team2 || !team1.name || !team2.name) {
			console.warn(`Match ${match.id} has invalid team IDs`);
			return;
		}

		if (match.team1_score !== undefined && match.team2_score !== undefined) {
			// Determine the winner and update wins
			if (match.team1_score > match.team2_score) {
				teamScores[team1.name].wins += 1;
				if (!teamScores[team1.name].headToHeadWins[team2.name]) {
					teamScores[team1.name].headToHeadWins[team2.name] = 0;
				}
				teamScores[team1.name].headToHeadWins[team2.name] += 1;
			} else if (match.team2_score > match.team1_score) {
				teamScores[team2.name].wins += 1;
				if (!teamScores[team2.name].headToHeadWins[team1.name]) {
					teamScores[team2.name].headToHeadWins[team1.name] = 0;
				}
				teamScores[team2.name].headToHeadWins[team1.name] += 1;
			}

			// Update points differential and total points
			const team1PointsDiff = (match.team1_score ?? 0) - (match.team2_score ?? 0);
			const team2PointsDiff = (match.team2_score ?? 0) - (match.team1_score ?? 0);

			teamScores[team1.name].pointsDiff += team1PointsDiff;
			teamScores[team2.name].pointsDiff += team2PointsDiff;

			// Keep track of total points for tiebreaking purposes
			teamScores[team1.name].totalPoints += match.team1_score ?? 0;
			teamScores[team2.name].totalPoints += match.team2_score ?? 0;
		}
	});

	// Function to handle sorting logic
	function sortTeams(a: string, b: string) {
		const teamA = teamScores[a];
		const teamB = teamScores[b];

		// Compare by wins first
		if (teamA.wins !== teamB.wins) {
			return teamB.wins - teamA.wins;
		}

		// If tied on wins, check head-to-head
		const headToHeadA = teamA.headToHeadWins[b] || 0;
		const headToHeadB = teamB.headToHeadWins[a] || 0;

		if (headToHeadA !== headToHeadB) {
			// If team A won the head-to-head matchup, rank team A higher
			// If team B won the head-to-head matchup, rank team B higher
			return headToHeadB - headToHeadA;
		}

		// If still tied, use points differential
		if (teamA.pointsDiff !== teamB.pointsDiff) {
			return teamB.pointsDiff - teamA.pointsDiff;
		}

		// Lastly, if still tied, use total points
		return teamB.totalPoints - teamA.totalPoints;
	}

	// Sort the teams based on the custom sort function
	const sortedTeams = Object.keys(teamScores).sort(sortTeams);

	// Return the sorted standings
	return sortedTeams.map((teamName: string) => {
		return { name: teamName, ...teamScores[teamName] };
	});
}
