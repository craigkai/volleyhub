import type { Team } from './team.svelte';
import type { Match } from './match.svelte';

export function findStandings(
	matches: Match[],
	teams: Team[],
	scoringType: 'wins' | 'points' = 'wins',
	isIndividualFormat: boolean = false
): {
	name: string;
	wins: number;
	pointsDiff: number;
	headToHeadWins: Record<string, number>;
	totalPoints: number;
}[] {
	// Debug logging to understand team names
	if (import.meta.env.DEV && isIndividualFormat) {
		console.log('[findStandings] Teams:', teams.map(t => ({ id: t.id, name: t.name })));
	}

	// For individual format, filter to only match teams (those with "&" in name or referenced in matches)
	// This excludes single-player base entries like "1", "2", "3"
	const teamsUsedInMatches = isIndividualFormat
		? new Set(
				matches
					.flatMap((m) => {
						const t1 = teams.find((t) => t.id === m.team1);
						const t2 = teams.find((t) => t.id === m.team2);
						return [t1?.id, t2?.id].filter((id): id is number => id !== undefined);
					})
			)
		: null;

	const teamScores: TeamScores = teams.reduce((acc: TeamScores, team: Team) => {
		if (team.name) {
			if (isIndividualFormat) {
				// Skip teams not used in matches (these are likely base player entries with numeric names)
				if (teamsUsedInMatches && !teamsUsedInMatches.has(team.id)) {
					return acc;
				}

				// For individual format, create entries for each player in the team name
				// Team names should be like "Alice & Bob" or could be single names
				const players = team.name.split(/\s*[&+,]\s*/).map(name => name.trim());

				if (import.meta.env.DEV) {
					console.log(`[findStandings] Team "${team.name}" split into:`, players);
				}

				players.forEach(playerName => {
					if (!acc[playerName]) {
						acc[playerName] = { wins: 0, pointsDiff: 0, headToHeadWins: {}, totalPoints: 0 };
					}
				});
			} else {
				// For fixed teams, use the team name as-is
				acc[team.name] = { wins: 0, pointsDiff: 0, headToHeadWins: {}, totalPoints: 0 };
			}
		}
		return acc;
	}, {});

	// First pass to calculate wins, points differential, and head-to-head results
	matches.forEach((match: Match) => {
		if (match.team1_score === undefined || match.team2_score === undefined) {
			return; // Skip incomplete matches
		}

		// Get all teams on each side using match_teams junction table
		let homeTeams: Team[] = [];
		let awayTeams: Team[] = [];

		if (isIndividualFormat && match.match_teams && match.match_teams.length > 0) {
			// Use match_teams to find all players on each side
			match.match_teams.forEach((mt) => {
				const team = teams.find((t) => t.id === mt.team_id);
				if (team) {
					if (mt.side === 'home') {
						homeTeams.push(team);
					} else if (mt.side === 'away') {
						awayTeams.push(team);
					}
				}
			});

			if (import.meta.env.DEV) {
				console.log(`[findStandings] Match ${match.id}:`, {
					homeTeams: homeTeams.map(t => t.name),
					awayTeams: awayTeams.map(t => t.name),
					homeScore: match.team1_score,
					awayScore: match.team2_score
				});
			}
		} else {
			// Fixed teams or fallback to old team1/team2 fields
			const team1 = teams.find((t: Team) => t.id === match.team1);
			const team2 = teams.find((t: Team) => t.id === match.team2);
			if (team1) homeTeams.push(team1);
			if (team2) awayTeams.push(team2);
		}

		if (homeTeams.length === 0 || awayTeams.length === 0) {
			console.warn(`Match ${match.id} has invalid team configuration`);
			return;
		}

		// Get player names from teams
		const homePlayers = isIndividualFormat
			? homeTeams.flatMap((t) => (t.name ? t.name.split(/\s*[&+,]\s*/).map(name => name.trim()) : []))
			: homeTeams.map((t) => t.name).filter((name): name is string => !!name);

		const awayPlayers = isIndividualFormat
			? awayTeams.flatMap((t) => (t.name ? t.name.split(/\s*[&+,]\s*/).map(name => name.trim()) : []))
			: awayTeams.map((t) => t.name).filter((name): name is string => !!name);

		const homeScore = match.team1_score ?? 0;
		const awayScore = match.team2_score ?? 0;

		// Determine the winner and update wins
		if (homeScore > awayScore) {
			// Home team wins - credit all players on home team
			homePlayers.forEach(playerName => {
				if (teamScores[playerName]) {
					teamScores[playerName].wins += 1;
					// Track head-to-head against opposing players
					awayPlayers.forEach(opponentName => {
						if (!teamScores[playerName].headToHeadWins[opponentName]) {
							teamScores[playerName].headToHeadWins[opponentName] = 0;
						}
						teamScores[playerName].headToHeadWins[opponentName] += 1;
					});
				}
			});
		} else if (awayScore > homeScore) {
			// Away team wins - credit all players on away team
			awayPlayers.forEach(playerName => {
				if (teamScores[playerName]) {
					teamScores[playerName].wins += 1;
					// Track head-to-head against opposing players
					homePlayers.forEach(opponentName => {
						if (!teamScores[playerName].headToHeadWins[opponentName]) {
							teamScores[playerName].headToHeadWins[opponentName] = 0;
						}
						teamScores[playerName].headToHeadWins[opponentName] += 1;
					});
				}
			});
		}

		// Update points differential and total points for all players
		const homePointsDiff = homeScore - awayScore;
		const awayPointsDiff = awayScore - homeScore;

		homePlayers.forEach(playerName => {
			if (teamScores[playerName]) {
				teamScores[playerName].pointsDiff += homePointsDiff;
				teamScores[playerName].totalPoints += homeScore;
			}
		});

		awayPlayers.forEach(playerName => {
			if (teamScores[playerName]) {
				teamScores[playerName].pointsDiff += awayPointsDiff;
				teamScores[playerName].totalPoints += awayScore;
			}
		});
	});

	// Function to handle sorting logic
	function sortTeams(a: string, b: string) {
		const teamA = teamScores[a];
		const teamB = teamScores[b];

		if (scoringType === 'points') {
			// When scoring by points, prioritize total points first
			if (teamA.totalPoints !== teamB.totalPoints) {
				return teamB.totalPoints - teamA.totalPoints;
			}

			// If tied on points, check head-to-head wins
			const headToHeadA = teamA.headToHeadWins[b] || 0;
			const headToHeadB = teamB.headToHeadWins[a] || 0;

			if (headToHeadA !== headToHeadB) {
				return headToHeadB - headToHeadA;
			}

			// If still tied, use points differential
			if (teamA.pointsDiff !== teamB.pointsDiff) {
				return teamB.pointsDiff - teamA.pointsDiff;
			}

			// Finally, use wins
			return teamB.wins - teamA.wins;
		} else {
			// When scoring by wins (default), prioritize wins first
			if (teamA.wins !== teamB.wins) {
				return teamB.wins - teamA.wins;
			}

			// If tied on wins, check head-to-head
			const headToHeadA = teamA.headToHeadWins[b] || 0;
			const headToHeadB = teamB.headToHeadWins[a] || 0;

			if (headToHeadA !== headToHeadB) {
				return headToHeadB - headToHeadA;
			}

			// If still tied, use points differential
			if (teamA.pointsDiff !== teamB.pointsDiff) {
				return teamB.pointsDiff - teamA.pointsDiff;
			}

			// Lastly, if still tied, use total points
			return teamB.totalPoints - teamA.totalPoints;
		}
	}

	// Sort the teams based on the custom sort function
	const sortedTeams = Object.keys(teamScores).sort(sortTeams);

	// Return the sorted standings
	return sortedTeams.map((teamName: string) => {
		return { name: teamName, ...teamScores[teamName] };
	});
}
