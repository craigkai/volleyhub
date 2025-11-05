import { Base } from './base';
import type { Team } from './team.svelte';

/**
 * Represents a match pairing with home and away teams
 */
export interface MatchPairing {
	homeTeams: number[]; // Array of team IDs for home side
	awayTeams: number[]; // Array of team IDs for away side
}

/**
 * The PairingGenerator class handles various algorithms for generating match pairings.
 * Works with the unified team model where everything is a team (whether 1-person or multi-person).
 */
export class PairingGenerator extends Base {
	/**
	 * Generate snake draft pairings for balanced matches.
	 * Works for both individual format (1-person teams) and fixed teams.
	 *
	 * Algorithm for individual 2v2 (4 teams of size 1):
	 * - Pair 1-4, 2-3, 5-8, 6-7 (balanced skill distribution)
	 * - Returns: [{homeTeams: [1,4], awayTeams: [2,3]}, {homeTeams: [5,8], awayTeams: [6,7]}]
	 *
	 * For individual 3v3 (6 teams of size 1):
	 * - Uses snake draft to distribute top teams evenly
	 * - Returns: [{homeTeams: [1,4,5], awayTeams: [2,3,6]}]
	 *
	 * @param {Team[]} teams - All teams (sorted by standings, best first)
	 * @param {number} teamsPerSide - Number of teams per side (e.g., 3 for 3v3 individual)
	 * @returns {MatchPairing[]} - Array of match pairings
	 */
	generateSnakeDraftPairings(teams: Team[], teamsPerSide: number): MatchPairing[] {
		const totalTeams = teams.length;
		const teamsPerMatch = teamsPerSide * 2;

		if (totalTeams % teamsPerMatch !== 0) {
			throw new Error(
				`Team count (${totalTeams}) must be divisible by teams per match (${teamsPerMatch})`
			);
		}

		const pairings: MatchPairing[] = [];

		// For 2v2: Simple balanced pairing (1-4, 2-3 pattern)
		if (teamsPerSide === 1) {
			// Fixed teams 1v1
			for (let i = 0; i < totalTeams; i += 2) {
				if (i + 1 < totalTeams) {
					pairings.push({
						homeTeams: [teams[i].id!],
						awayTeams: [teams[i + 1].id!]
					});
				}
			}
		} else if (teamsPerSide === 2) {
			// Individual 2v2 or fixed teams with 2 per side
			for (let i = 0; i < totalTeams; i += 4) {
				if (i + 3 < totalTeams) {
					// Match 1: 1st and 4th vs 2nd and 3rd (balanced)
					pairings.push({
						homeTeams: [teams[i].id!, teams[i + 3].id!],
						awayTeams: [teams[i + 1].id!, teams[i + 2].id!]
					});
				} else if (i + 1 < totalTeams) {
					// Handle remaining teams - pair consecutively
					pairings.push({
						homeTeams: [teams[i].id!],
						awayTeams: [teams[i + 1].id!]
					});
				}
			}
		} else {
			// For larger formats (3v3, 4v4, etc.): Use snake draft
			// Distribute teams evenly across matches using snake pattern
			const numMatches = totalTeams / teamsPerMatch;

			for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
				const homeTeams: number[] = [];
				const awayTeams: number[] = [];

				// Snake draft pattern to balance skill levels
				for (let sidePos = 0; sidePos < teamsPerSide; sidePos++) {
					// Calculate indices using snake draft pattern
					const roundIdx = Math.floor((matchIdx * teamsPerSide + sidePos) / numMatches);
					const posInRound = (matchIdx * teamsPerSide + sidePos) % numMatches;

					let teamIdx: number;
					if (roundIdx % 2 === 0) {
						// Forward direction
						teamIdx = roundIdx * numMatches + posInRound;
					} else {
						// Reverse direction
						teamIdx = roundIdx * numMatches + (numMatches - 1 - posInRound);
					}

					if (teamIdx < totalTeams && teams[teamIdx].id) {
						if (sidePos < teamsPerSide / 2 || teamsPerSide === 1) {
							homeTeams.push(teams[teamIdx].id!);
						} else {
							awayTeams.push(teams[teamIdx].id!);
						}
					}
				}

				// Distribute evenly
				const midpoint = Math.ceil(teamsPerSide);
				const actualHome = homeTeams.slice(0, midpoint);
				const actualAway = [...homeTeams.slice(midpoint), ...awayTeams];

				pairings.push({
					homeTeams: actualHome.slice(0, teamsPerSide),
					awayTeams: actualAway.slice(0, teamsPerSide)
				});
			}
		}

		return pairings;
	}

	/**
	 * Generate simple consecutive pairings (1v2, 3v4, 5v6, etc.)
	 * Used for quick pairing without skill balancing.
	 *
	 * @param {Team[]} teams - All teams
	 * @param {number} teamsPerSide - Number of teams per side
	 * @returns {MatchPairing[]} - Array of match pairings
	 */
	generateConsecutivePairings(teams: Team[], teamsPerSide: number): MatchPairing[] {
		const totalTeams = teams.length;
		const teamsPerMatch = teamsPerSide * 2;

		if (totalTeams % teamsPerMatch !== 0) {
			throw new Error(
				`Team count (${totalTeams}) must be divisible by teams per match (${teamsPerMatch})`
			);
		}

		const pairings: MatchPairing[] = [];

		for (let i = 0; i < totalTeams; i += teamsPerMatch) {
			const homeTeams: number[] = [];
			const awayTeams: number[] = [];

			// First half goes to home
			for (let j = 0; j < teamsPerSide; j++) {
				if (i + j < totalTeams && teams[i + j].id) {
					homeTeams.push(teams[i + j].id!);
				}
			}

			// Second half goes to away
			for (let j = teamsPerSide; j < teamsPerMatch; j++) {
				if (i + j < totalTeams && teams[i + j].id) {
					awayTeams.push(teams[i + j].id!);
				}
			}

			if (homeTeams.length === teamsPerSide && awayTeams.length === teamsPerSide) {
				pairings.push({
					homeTeams,
					awayTeams
				});
			}
		}

		return pairings;
	}

	/**
	 * Generate random pairings.
	 *
	 * @param {Team[]} teams - All teams
	 * @param {number} teamsPerSide - Number of teams per side
	 * @returns {MatchPairing[]} - Array of match pairings
	 */
	generateRandomPairings(teams: Team[], teamsPerSide: number): MatchPairing[] {
		const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
		return this.generateConsecutivePairings(shuffledTeams, teamsPerSide);
	}

	/**
	 * Generate round-robin pairings (every team plays every other team).
	 * Used for fixed teams tournaments.
	 *
	 * @param {Team[]} teams - All teams
	 * @param {number} maxGames - Maximum games each team should play
	 * @returns {MatchPairing[]} - Array of match pairings
	 */
	generateRoundRobinPairings(teams: Team[], maxGames: number): MatchPairing[] {
		const pairings: MatchPairing[] = [];
		const teamGames = new Map<number, number>();
		const playedMatches = new Set<string>();

		// Initialize game counts
		teams.forEach((team) => {
			if (team.id) {
				teamGames.set(team.id, 0);
			}
		});

		// Generate all possible matchups
		const allMatchups: MatchPairing[] = [];
		for (let i = 0; i < teams.length; i++) {
			for (let j = i + 1; j < teams.length; j++) {
				if (teams[i].id && teams[j].id) {
					allMatchups.push({
						homeTeams: [teams[i].id],
						awayTeams: [teams[j].id]
					});
				}
			}
		}

		// Schedule matches using balanced approach
		while (this.hasTeamsNeedingGames(teamGames, maxGames)) {
			const roundPairings = this.scheduleBalancedRound(
				allMatchups,
				teamGames,
				playedMatches,
				maxGames
			);

			if (roundPairings.length === 0) {
				break; // No more valid matches can be scheduled
			}

			pairings.push(...roundPairings);
		}

		return pairings;
	}

	/**
	 * Check if any teams still need more games
	 */
	private hasTeamsNeedingGames(teamGames: Map<number, number>, maxGames: number): boolean {
		return Array.from(teamGames.values()).some((count) => count < maxGames);
	}

	/**
	 * Schedule a balanced round of matches
	 */
	private scheduleBalancedRound(
		allMatchups: MatchPairing[],
		teamGames: Map<number, number>,
		playedMatches: Set<string>,
		maxGames: number
	): MatchPairing[] {
		const roundPairings: MatchPairing[] = [];
		const usedTeams = new Set<number>();

		// Sort matchups by priority (teams with fewer games first)
		const prioritizedMatchups = allMatchups
			.filter((pairing) => {
				const team1 = pairing.homeTeams[0];
				const team2 = pairing.awayTeams[0];
				const matchKey = `${Math.min(team1, team2)}-${Math.max(team1, team2)}`;
				return (
					!playedMatches.has(matchKey) &&
					teamGames.get(team1)! < maxGames &&
					teamGames.get(team2)! < maxGames
				);
			})
			.sort((a, b) => {
				const team1A = a.homeTeams[0];
				const team2A = a.awayTeams[0];
				const team1B = b.homeTeams[0];
				const team2B = b.awayTeams[0];
				const priorityA = teamGames.get(team1A)! + teamGames.get(team2A)!;
				const priorityB = teamGames.get(team1B)! + teamGames.get(team2B)!;
				return priorityA - priorityB;
			});

		// Schedule matches for this round
		for (const pairing of prioritizedMatchups) {
			const team1 = pairing.homeTeams[0];
			const team2 = pairing.awayTeams[0];

			if (!usedTeams.has(team1) && !usedTeams.has(team2)) {
				roundPairings.push(pairing);
				usedTeams.add(team1);
				usedTeams.add(team2);

				// Update game counts and played matches
				teamGames.set(team1, teamGames.get(team1)! + 1);
				teamGames.set(team2, teamGames.get(team2)! + 1);

				const matchKey = `${Math.min(team1, team2)}-${Math.max(team1, team2)}`;
				playedMatches.add(matchKey);
			}
		}

		// Allow rematches if needed
		if (roundPairings.length === 0 && this.hasTeamsNeedingGames(teamGames, maxGames)) {
			const rematchCandidates = allMatchups
				.filter((pairing) => {
					const team1 = pairing.homeTeams[0];
					const team2 = pairing.awayTeams[0];
					return (
						!usedTeams.has(team1) &&
						!usedTeams.has(team2) &&
						teamGames.get(team1)! < maxGames &&
						teamGames.get(team2)! < maxGames
					);
				})
				.sort((a, b) => {
					const team1A = a.homeTeams[0];
					const team2A = a.awayTeams[0];
					const team1B = b.homeTeams[0];
					const team2B = b.awayTeams[0];
					const priorityA = teamGames.get(team1A)! + teamGames.get(team2A)!;
					const priorityB = teamGames.get(team1B)! + teamGames.get(team2B)!;
					return priorityA - priorityB;
				});

			for (const pairing of rematchCandidates) {
				const team1 = pairing.homeTeams[0];
				const team2 = pairing.awayTeams[0];

				if (!usedTeams.has(team1) && !usedTeams.has(team2)) {
					roundPairings.push(pairing);
					usedTeams.add(team1);
					usedTeams.add(team2);

					teamGames.set(team1, teamGames.get(team1)! + 1);
					teamGames.set(team2, teamGames.get(team2)! + 1);
				}
			}
		}

		return roundPairings;
	}
}
