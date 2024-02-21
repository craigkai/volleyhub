export async function findStandings(
	matches: MatchRow[],
	event: Event,
	teams: TeamRow[]
): Promise<TeamScores> {
	let teamScores: TeamScores = teams.reduce((acc: TeamScores, team: TeamRow) => {
		acc[team.name] = 0;
		return acc;
	}, {});

	matches.forEach((match: MatchRow) => {
		if (match.team1_score && match.team2_score) {
			if (!teamScores[match.matches_team1_fkey.name]) {
				teamScores[match.matches_team1_fkey.name] = 0;
			}

			if (!teamScores[match.matches_team2_fkey.name]) {
				teamScores[match.matches_team2_fkey.name] = 0;
			}

			if (event?.scoring === 'points') {
				teamScores[match.matches_team1_fkey.name] += match?.team1_score || 0;
				teamScores[match.matches_team2_fkey.name] += match?.team2_score || 0;
			} else {
				teamScores[match.matches_team1_fkey.name] += match.team1_score > match.team2_score ? 1 : 0;
				teamScores[match.matches_team2_fkey.name] += match.team2_score > match.team1_score ? 1 : 0;
			}
		}
	});

	return teamScores;
}
