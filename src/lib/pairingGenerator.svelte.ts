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

		// Allow uneven numbers - teams that don't fit into complete matches will sit out
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
			// Snake draft ensures balanced skill distribution
			// For 3v3 with 6 players: 1,4,5 vs 2,3,6
			// Pattern: H, A, A, H, H, A, A, H, H, A, ...
			// Only create complete matches - remaining teams sit out
			const numMatches = Math.floor(totalTeams / teamsPerMatch);

			for (let matchIdx = 0; matchIdx < numMatches; matchIdx++) {
				const homeTeams: number[] = [];
				const awayTeams: number[] = [];

				const baseIdx = matchIdx * teamsPerMatch;

				// Snake draft pattern
				for (let i = 0; i < teamsPerMatch && baseIdx + i < totalTeams; i++) {
					if (teams[baseIdx + i].id) {
						// Determine which side based on snake pattern
						// Group into pairs: (0,1), (2,3), (4,5), ...
						// Within each pair, first goes to home, second to away
						// But pairs alternate: pair 0 is H-A, pair 1 is A-H (snake), pair 2 is H-A
						const pairIndex = Math.floor(i / 2);
						const positionInPair = i % 2;

						let assignToHome: boolean;
						if (pairIndex % 2 === 0) {
							// Even pairs: first pick home, second pick away (H-A pattern)
							assignToHome = positionInPair === 0;
						} else {
							// Odd pairs: first pick away, second pick home (A-H pattern for snake)
							assignToHome = positionInPair === 1;
						}

						if (assignToHome) {
							homeTeams.push(teams[baseIdx + i].id!);
						} else {
							awayTeams.push(teams[baseIdx + i].id!);
						}
					}
				}

				// Only create match if we have enough teams for both sides
				if (homeTeams.length === teamsPerSide && awayTeams.length === teamsPerSide) {
					pairings.push({
						homeTeams,
						awayTeams
					});
				}
			}
		}

		return pairings;
	}

	/**
	 * Generate multiple rounds of individual pairings for mix-and-match tournaments.
	 * Uses a greedy algorithm to minimize repeat teammates and opponents.
	 *
	 * @param {Team[]} teams - All teams (players)
	 * @param {number} teamsPerSide - Number of players per side (e.g., 3 for 3v3)
	 * @param {number} targetGamesPerPlayer - Target number of games each player should play
	 * @returns {MatchPairing[]} - Array of match pairings across all rounds
	 */
	generateMultiRoundIndividualPairings(
		teams: Team[],
		teamsPerSide: number,
		targetGamesPerPlayer: number
	): MatchPairing[] {
		const allPairings: MatchPairing[] = [];
		const teamsPerMatch = teamsPerSide * 2;
		const playerGames = new Map<number, number>();

		// Track teammate and opponent history
		const teammateHistory = new Map<string, number>(); // "playerId1-playerId2" -> count
		const opponentHistory = new Map<string, number>(); // "playerId1-playerId2" -> count

		// Initialize game counts
		teams.forEach((team) => {
			if (team.id) {
				playerGames.set(team.id, 0);
			}
		});

		// Keep generating rounds until all players have played enough games
		let roundCount = 0;
		const maxRounds = targetGamesPerPlayer * 2; // Safety limit to prevent infinite loops

		while (this.hasTeamsNeedingGames(playerGames, targetGamesPerPlayer) && roundCount < maxRounds) {
			// Get players who still need games
			const availablePlayers = teams.filter(
				(team) => team.id && (playerGames.get(team.id) ?? 0) < targetGamesPerPlayer
			);

			if (availablePlayers.length < teamsPerMatch) {
				break; // Not enough players for a full match
			}

			// Generate multiple candidate pairings and pick the best one
			const numCandidates = Math.min(500, Math.max(50, availablePlayers.length * 10));
			let bestPairing: MatchPairing[] | null = null;
			let bestScore = Infinity;

			for (let i = 0; i < numCandidates; i++) {
				// Shuffle available players
				const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);

				// Generate pairings for this candidate
				const candidatePairings = this.generateSnakeDraftPairings(shuffled, teamsPerSide);

				// Only consider candidates where all players need games
				const validPairings = candidatePairings.filter((pairing) =>
					[...pairing.homeTeams, ...pairing.awayTeams].every(
						(playerId) => (playerGames.get(playerId) ?? 0) < targetGamesPerPlayer
					)
				);

				if (validPairings.length === 0) continue;

				// Score this candidate
				const score = this.scorePairings(validPairings, teammateHistory, opponentHistory);

				if (score < bestScore) {
					bestScore = score;
					bestPairing = validPairings;
				}
			}

			// Add best pairings and update histories
			if (bestPairing) {
				for (const pairing of bestPairing) {
					allPairings.push(pairing);

					// Update game counts
					[...pairing.homeTeams, ...pairing.awayTeams].forEach((playerId) => {
						playerGames.set(playerId, (playerGames.get(playerId) ?? 0) + 1);
					});

					// Update teammate history
					this.updateTeammateHistory(pairing.homeTeams, teammateHistory);
					this.updateTeammateHistory(pairing.awayTeams, teammateHistory);

					// Update opponent history
					this.updateOpponentHistory(pairing.homeTeams, pairing.awayTeams, opponentHistory);
				}
			}

			roundCount++;
		}

		return allPairings;
	}

	/**
	 * Score a set of pairings based on repeat penalties.
	 * Lower scores are better (fewer repeats).
	 */
	private scorePairings(
		pairings: MatchPairing[],
		teammateHistory: Map<string, number>,
		opponentHistory: Map<string, number>
	): number {
		let score = 0;

		for (const pairing of pairings) {
			// Penalize teammate repeats (squared to heavily penalize multiple repeats)
			score += this.scoreTeammates(pairing.homeTeams, teammateHistory);
			score += this.scoreTeammates(pairing.awayTeams, teammateHistory);

			// Penalize opponent repeats (squared to heavily penalize multiple repeats)
			score += this.scoreOpponents(pairing.homeTeams, pairing.awayTeams, opponentHistory);
		}

		return score;
	}

	/**
	 * Score teammate pairs within a team.
	 */
	private scoreTeammates(teamIds: number[], history: Map<string, number>): number {
		let score = 0;
		for (let i = 0; i < teamIds.length; i++) {
			for (let j = i + 1; j < teamIds.length; j++) {
				const key = this.getPairKey(teamIds[i], teamIds[j]);
				const count = history.get(key) ?? 0;
				// Square the count to heavily penalize multiple repeats
				score += count * count;
			}
		}
		return score;
	}

	/**
	 * Score opponent pairs between two teams.
	 */
	private scoreOpponents(
		homeTeamIds: number[],
		awayTeamIds: number[],
		history: Map<string, number>
	): number {
		let score = 0;
		for (const homeId of homeTeamIds) {
			for (const awayId of awayTeamIds) {
				const key = this.getPairKey(homeId, awayId);
				const count = history.get(key) ?? 0;
				// Square the count to heavily penalize multiple repeats
				score += count * count;
			}
		}
		return score;
	}

	/**
	 * Update teammate history for a team.
	 */
	private updateTeammateHistory(teamIds: number[], history: Map<string, number>): void {
		for (let i = 0; i < teamIds.length; i++) {
			for (let j = i + 1; j < teamIds.length; j++) {
				const key = this.getPairKey(teamIds[i], teamIds[j]);
				history.set(key, (history.get(key) ?? 0) + 1);
			}
		}
	}

	/**
	 * Update opponent history between two teams.
	 */
	private updateOpponentHistory(
		homeTeamIds: number[],
		awayTeamIds: number[],
		history: Map<string, number>
	): void {
		for (const homeId of homeTeamIds) {
			for (const awayId of awayTeamIds) {
				const key = this.getPairKey(homeId, awayId);
				history.set(key, (history.get(key) ?? 0) + 1);
			}
		}
	}

	/**
	 * Get a consistent pair key for two player IDs.
	 */
	private getPairKey(id1: number, id2: number): string {
		return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
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

		// Allow uneven numbers - teams that don't fit into complete matches will sit out
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
