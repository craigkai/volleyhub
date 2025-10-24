import { Base } from './base';
import type { Player } from './player.svelte';
import type { IndividualStanding } from './individualStandings.svelte';

/**
 * The PairingGenerator class handles various algorithms for generating team pairings
 * in mix-and-match and King & Queen tournaments.
 */
export class PairingGenerator extends Base {
	/**
	 * Generate King & Queen pairings (equal number of males and females per team).
	 *
	 * Algorithm:
	 * 1. Separate players by gender and sort by standings
	 * 2. Distribute top players across teams evenly
	 * 3. Create teams with equal gender distribution
	 *
	 * Supports flexible team sizes:
	 * - 2v2: 1 king + 1 queen per team
	 * - 4v4: 2 kings + 2 queens per team
	 * - 6v6: 3 kings + 3 queens per team
	 *
	 * @param {Player[]} players - All players in the tournament
	 * @param {number} eventId - Event ID
	 * @param {number} round - Current round number
	 * @param {IndividualStanding[]} standings - Current player standings
	 * @param {number} teamSize - Total players per team (must be even)
	 * @returns {Promise<Partial<TeamRow>[]>} - Array of team data ready to be inserted
	 */
	async generateKingQueenPairings(
		players: Player[],
		eventId: number,
		round: number,
		standings: IndividualStanding[],
		teamSize: number = 2
	): Promise<Partial<TeamRow>[]> {
		if (teamSize % 2 !== 0) {
			throw new Error('Team size must be even for King & Queen format');
		}

		const playersPerGender = teamSize / 2;

		// Separate by gender and sort by standings (already sorted in standings array)
		const kings = standings.filter((s) => s.player.gender === 'male').map((s) => s.player);
		const queens = standings.filter((s) => s.player.gender === 'female').map((s) => s.player);

		if (kings.length !== queens.length) {
			throw new Error('King & Queen requires equal number of male and female players');
		}

		if (kings.length % playersPerGender !== 0) {
			throw new Error(
				`Need ${playersPerGender} males and ${playersPerGender} females per team. Current: ${kings.length} males, ${queens.length} females`
			);
		}

		const teams: Array<{ team: Partial<TeamRow>; playerIds: number[] }> = [];
		let teamNum = 1;

		// Create teams with equal gender distribution
		for (let i = 0; i < kings.length; i += playersPerGender) {
			const teamPlayerIds: number[] = [];

			// Add kings to this team
			for (let j = 0; j < playersPerGender; j++) {
				if (i + j < kings.length && kings[i + j].id) {
					teamPlayerIds.push(kings[i + j].id!);
				}
			}

			// Add queens to this team
			for (let j = 0; j < playersPerGender; j++) {
				if (i + j < queens.length && queens[i + j].id) {
					teamPlayerIds.push(queens[i + j].id!);
				}
			}

			// Generate team name
			let teamName: string;
			if (teamSize === 2) {
				teamName = `${kings[i].name} & ${queens[i].name}`;
			} else {
				teamName = `Round ${round} - Team ${teamNum}`;
			}

			teams.push({
				team: {
					name: teamName,
					event_id: eventId,
					is_temporary: true,
					round: round,
					team_size: teamSize
				},
				playerIds: teamPlayerIds
			});

			teamNum++;
		}

		return teams;
	}

	/**
	 * Generate snake draft pairings for balanced matches.
	 * Works for any team size.
	 *
	 * Algorithm for 2v2:
	 * - Pair 1-4, 2-3, 5-8, 6-7 (balanced skill distribution)
	 *
	 * For larger teams:
	 * - Uses snake draft pattern to distribute top players evenly
	 *
	 * @param {Player[]} players - All players in the tournament
	 * @param {number} eventId - Event ID
	 * @param {number} round - Current round number
	 * @param {IndividualStanding[]} standings - Current player standings
	 * @param {number} teamSize - Total players per team
	 * @returns {Promise<Partial<TeamRow>[]>} - Array of team data ready to be inserted
	 */
	async generateSnakeDraftPairings(
		players: Player[],
		eventId: number,
		round: number,
		standings: IndividualStanding[],
		teamSize: number = 2
	): Promise<Partial<TeamRow>[]> {
		const sortedPlayers = standings.map((s) => s.player);
		const totalPlayers = sortedPlayers.length;

		if (totalPlayers % teamSize !== 0) {
			throw new Error(
				`Player count (${totalPlayers}) must be divisible by team size (${teamSize})`
			);
		}

		const teams: Array<{ team: Partial<TeamRow>; playerIds: number[] }> = [];
		const numTeams = totalPlayers / teamSize;
		let teamNum = 1;

		// For 2v2: Simple snake draft
		if (teamSize === 2) {
			for (let i = 0; i < totalPlayers; i += 4) {
				// Check if we can create a balanced pair (1-4, 2-3 pattern)
				if (i + 3 < totalPlayers) {
					// Team 1: 1st and 4th (balanced)
					teams.push({
						team: {
							name: `${sortedPlayers[i].name} & ${sortedPlayers[i + 3].name}`,
							event_id: eventId,
							is_temporary: true,
							round: round,
							team_size: teamSize
						},
						playerIds: [sortedPlayers[i].id!, sortedPlayers[i + 3].id!]
					});

					// Team 2: 2nd and 3rd (balanced)
					teams.push({
						team: {
							name: `${sortedPlayers[i + 1].name} & ${sortedPlayers[i + 2].name}`,
							event_id: eventId,
							is_temporary: true,
							round: round,
							team_size: teamSize
						},
						playerIds: [sortedPlayers[i + 1].id!, sortedPlayers[i + 2].id!]
					});
				} else if (i + 1 < totalPlayers) {
					// Handle remaining players (less than 4 left) - pair consecutively
					for (let j = i; j + 1 < totalPlayers; j += 2) {
						teams.push({
							team: {
								name: `${sortedPlayers[j].name} & ${sortedPlayers[j + 1].name}`,
								event_id: eventId,
								is_temporary: true,
								round: round,
								team_size: teamSize
							},
							playerIds: [sortedPlayers[j].id!, sortedPlayers[j + 1].id!]
						});
					}
					break; // Exit loop after handling remaining players
				}
			}
		} else {
			// For larger teams: Distribute by snake draft
			for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) {
				const teamPlayerIds: number[] = [];

				// Snake pattern: pick players in alternating order
				for (let playerSlot = 0; playerSlot < teamSize; playerSlot++) {
					const snakeRound = Math.floor(playerSlot / numTeams);
					let pickIdx: number;

					if (snakeRound % 2 === 0) {
						// Forward: Team 0 picks first
						pickIdx = snakeRound * numTeams + teamIdx;
					} else {
						// Reverse: Team N picks first
						pickIdx = snakeRound * numTeams + (numTeams - 1 - teamIdx);
					}

					if (pickIdx < totalPlayers && sortedPlayers[pickIdx].id) {
						teamPlayerIds.push(sortedPlayers[pickIdx].id!);
					}
				}

				// Generate team name based on team size
				let teamName: string;
				if (teamSize <= 4) {
					// For small teams (3v3, 4v4), show all player names
					const playerNames = teamPlayerIds
						.map((id) => sortedPlayers.find((p) => p.id === id)?.name)
						.filter(Boolean)
						.join(' & ');
					teamName = playerNames || `Team ${teamNum}`;
				} else {
					// For larger teams, use round-based naming
					teamName = `Round ${round} - Team ${teamNum}`;
				}

				teams.push({
					team: {
						name: teamName,
						event_id: eventId,
						is_temporary: true,
						round: round,
						team_size: teamSize
					},
					playerIds: teamPlayerIds
				});
				teamNum++;
			}
		}

		return teams;
	}

	/**
	 * Generate random pairings.
	 *
	 * @param {Player[]} players - All players in the tournament
	 * @param {number} eventId - Event ID
	 * @param {number} round - Current round number
	 * @param {number} teamSize - Total players per team
	 * @returns {Promise<Partial<TeamRow>[]>} - Array of team data ready to be inserted
	 */
	async generateRandomPairings(
		players: Player[],
		eventId: number,
		round: number,
		teamSize: number = 2
	): Promise<Array<{ team: Partial<TeamRow>; playerIds: number[] }>> {
		const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
		const totalPlayers = shuffledPlayers.length;

		if (totalPlayers % teamSize !== 0) {
			throw new Error(
				`Player count (${totalPlayers}) must be divisible by team size (${teamSize})`
			);
		}

		const teams: Array<{ team: Partial<TeamRow>; playerIds: number[] }> = [];
		const numTeams = totalPlayers / teamSize;
		let teamNum = 1;

		for (let i = 0; i < numTeams; i++) {
			const teamPlayerIds: number[] = [];

			for (let j = 0; j < teamSize; j++) {
				const playerIndex = i * teamSize + j;
				if (playerIndex < shuffledPlayers.length && shuffledPlayers[playerIndex].id) {
					teamPlayerIds.push(shuffledPlayers[playerIndex].id!);
				}
			}

			let teamName: string;
			if (teamSize === 2 && teamPlayerIds.length === 2) {
				const p1 = shuffledPlayers[i * teamSize];
				const p2 = shuffledPlayers[i * teamSize + 1];
				teamName = `${p1.name} & ${p2.name}`;
			} else {
				teamName = `Team ${teamNum}`;
			}

			teams.push({
				team: {
					name: teamName,
					event_id: eventId,
					is_temporary: true,
					round: round,
					team_size: teamSize
				},
				playerIds: teamPlayerIds
			});
			teamNum++;
		}

		return teams;
	}

	/**
	 * Track which players have played together to avoid repeating partnerships.
	 * (Future enhancement)
	 *
	 * @param {number} playerId - The player ID
	 * @param {Match[]} previousMatches - Previous matches played
	 * @returns {Set<number>} - Set of player IDs this player has partnered with
	 */
	private getPartnerHistory(playerId: number, previousMatches: any[]): Set<number> {
		const partners = new Set<number>();
		// TODO: Implement partner history tracking
		// This would query player_teams to find all players who have been on the same team
		return partners;
	}
}
