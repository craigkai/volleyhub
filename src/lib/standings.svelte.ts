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
						// Use match_teams if available to get all players, not just team1/team2
						if (m.match_teams && m.match_teams.length > 0) {
							return m.match_teams.map((mt) => mt.team_id);
						}
						// Fallback to team1/team2
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

// Test cases for standings calculation
if (import.meta.vitest) {
	const { describe, it, expect, beforeEach } = import.meta.vitest;

	describe('findStandings for individual/mix-and-match format', () => {
		it('should calculate individual player standings correctly with match_teams', () => {
			// Setup: Create players (teams with single names)
			const teams: Team[] = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Charlie' },
				{ id: 4, name: 'Diana' }
			] as Team[];

			// Setup: Create matches with match_teams junction table
			// Match 1: Alice & Bob (21) vs Charlie & Diana (15) - Alice & Bob win
			// Match 2: Alice & Charlie (18) vs Bob & Diana (21) - Bob & Diana win
			const matches: Match[] = [
				{
					id: 1,
					team1: 1, // Alice (first player on home side)
					team2: 3, // Charlie (first player on away side)
					team1_score: 21,
					team2_score: 15,
					match_teams: [
						{ id: 1, match_id: 1, team_id: 1, side: 'home', created_at: '' }, // Alice
						{ id: 2, match_id: 1, team_id: 2, side: 'home', created_at: '' }, // Bob
						{ id: 3, match_id: 1, team_id: 3, side: 'away', created_at: '' }, // Charlie
						{ id: 4, match_id: 1, team_id: 4, side: 'away', created_at: '' } // Diana
					]
				} as Match,
				{
					id: 2,
					team1: 1, // Alice (first player on home side)
					team2: 2, // Bob (first player on away side)
					team1_score: 18,
					team2_score: 21,
					match_teams: [
						{ id: 5, match_id: 2, team_id: 1, side: 'home', created_at: '' }, // Alice
						{ id: 6, match_id: 2, team_id: 3, side: 'home', created_at: '' }, // Charlie
						{ id: 7, match_id: 2, team_id: 2, side: 'away', created_at: '' }, // Bob
						{ id: 8, match_id: 2, team_id: 4, side: 'away', created_at: '' } // Diana
					]
				} as Match
			];

			// Act: Calculate standings with individual format
			const standings = findStandings(matches, teams, 'wins', true);

			// Assert: Each player should have correct stats
			// Alice: 1 win (match 1), 1 loss (match 2), points diff = (21-15) + (18-21) = +3
			// Bob: 1 win (match 1), 1 win (match 2), points diff = (21-15) + (21-18) = +9
			// Charlie: 1 loss (match 1), 1 loss (match 2), points diff = (15-21) + (18-21) = -9
			// Diana: 1 loss (match 1), 1 win (match 2), points diff = (15-21) + (21-18) = -3

			const bob = standings.find((s) => s.name === 'Bob');
			const alice = standings.find((s) => s.name === 'Alice');
			const diana = standings.find((s) => s.name === 'Diana');
			const charlie = standings.find((s) => s.name === 'Charlie');

			expect(bob).toBeDefined();
			expect(bob?.wins).toBe(2);
			expect(bob?.pointsDiff).toBe(9);

			expect(alice).toBeDefined();
			expect(alice?.wins).toBe(1);
			expect(alice?.pointsDiff).toBe(3);

			expect(diana).toBeDefined();
			expect(diana?.wins).toBe(1);
			expect(diana?.pointsDiff).toBe(-3);

			expect(charlie).toBeDefined();
			expect(charlie?.wins).toBe(0);
			expect(charlie?.pointsDiff).toBe(-9);

			// Bob should be ranked first (2 wins)
			expect(standings[0].name).toBe('Bob');
		});

		it('should handle missing match_teams gracefully', () => {
			// Setup: Create teams
			const teams: Team[] = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' }
			] as Team[];

			// Setup: Create a match without match_teams (fallback to team1/team2)
			const matches: Match[] = [
				{
					id: 1,
					team1: 1,
					team2: 2,
					team1_score: 21,
					team2_score: 15
					// No match_teams
				} as Match
			];

			// Act: Calculate standings - should fall back to using team1/team2
			const standings = findStandings(matches, teams, 'wins', true);

			// Assert: Should still work with fallback
			const alice = standings.find((s) => s.name === 'Alice');
			const bob = standings.find((s) => s.name === 'Bob');

			expect(alice).toBeDefined();
			expect(alice?.wins).toBe(1);

			expect(bob).toBeDefined();
			expect(bob?.wins).toBe(0);
		});

		it('should calculate total points correctly for individual format', () => {
			// Setup
			const teams: Team[] = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' }
			] as Team[];

			const matches: Match[] = [
				{
					id: 1,
					team1: 1,
					team2: 2,
					team1_score: 21,
					team2_score: 15,
					match_teams: [
						{ id: 1, match_id: 1, team_id: 1, side: 'home', created_at: '' }, // Alice
						{ id: 2, match_id: 1, team_id: 2, side: 'away', created_at: '' } // Bob
					]
				} as Match,
				{
					id: 2,
					team1: 1,
					team2: 2,
					team1_score: 18,
					team2_score: 21,
					match_teams: [
						{ id: 3, match_id: 2, team_id: 1, side: 'home', created_at: '' }, // Alice
						{ id: 4, match_id: 2, team_id: 2, side: 'away', created_at: '' } // Bob
					]
				} as Match
			];

			// Act
			const standings = findStandings(matches, teams, 'points', true);

			// Assert: Alice scored 21 + 18 = 39 total points
			const alice = standings.find((s) => s.name === 'Alice');
			expect(alice?.totalPoints).toBe(39);

			// Bob scored 15 + 21 = 36 total points
			const bob = standings.find((s) => s.name === 'Bob');
			expect(bob?.totalPoints).toBe(36);

			// Alice should be ranked first when sorting by points
			expect(standings[0].name).toBe('Alice');
		});

		it('should credit all players on a side when multiple teams per side', () => {
			// This is the critical test for the bug fix
			// Setup: 3v3 match with multiple players per side
			const teams: Team[] = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Charlie' },
				{ id: 4, name: 'Diana' },
				{ id: 5, name: 'Eve' },
				{ id: 6, name: 'Frank' }
			] as Team[];

			const matches: Match[] = [
				{
					id: 1,
					team1: 1, // Alice is first on home side
					team2: 4, // Diana is first on away side
					team1_score: 21,
					team2_score: 15,
					match_teams: [
						// Home side: Alice, Bob, Charlie
						{ id: 1, match_id: 1, team_id: 1, side: 'home', created_at: '' },
						{ id: 2, match_id: 1, team_id: 2, side: 'home', created_at: '' },
						{ id: 3, match_id: 1, team_id: 3, side: 'home', created_at: '' },
						// Away side: Diana, Eve, Frank
						{ id: 4, match_id: 1, team_id: 4, side: 'away', created_at: '' },
						{ id: 5, match_id: 1, team_id: 5, side: 'away', created_at: '' },
						{ id: 6, match_id: 1, team_id: 6, side: 'away', created_at: '' }
					]
				} as Match
			];

			// Act
			const standings = findStandings(matches, teams, 'wins', true);

			// Assert: All three home side players should have 1 win
			const alice = standings.find((s) => s.name === 'Alice');
			const bob = standings.find((s) => s.name === 'Bob');
			const charlie = standings.find((s) => s.name === 'Charlie');

			expect(alice?.wins).toBe(1);
			expect(bob?.wins).toBe(1);
			expect(charlie?.wins).toBe(1);

			// All three away side players should have 0 wins
			const diana = standings.find((s) => s.name === 'Diana');
			const eve = standings.find((s) => s.name === 'Eve');
			const frank = standings.find((s) => s.name === 'Frank');

			expect(diana?.wins).toBe(0);
			expect(eve?.wins).toBe(0);
			expect(frank?.wins).toBe(0);

			// All winners should have the same points differential
			expect(alice?.pointsDiff).toBe(6);
			expect(bob?.pointsDiff).toBe(6);
			expect(charlie?.pointsDiff).toBe(6);

			// All losers should have the same points differential
			expect(diana?.pointsDiff).toBe(-6);
			expect(eve?.pointsDiff).toBe(-6);
			expect(frank?.pointsDiff).toBe(-6);
		});
	});
}
