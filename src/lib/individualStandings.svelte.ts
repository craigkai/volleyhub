import type { Player } from './player.svelte';

/**
 * Interface for individual player standings
 */
export interface IndividualStanding {
	player: Player;
	wins: number;
	losses: number;
	pointsDiff: number;
	totalPoints: number;
	pointsAllowed: number;
	matchesPlayed: number;
	winPercentage: number;
}

/**
 * Calculate individual standings for players based on their match statistics.
 * Sorts players by: wins (desc), points differential (desc), total points (desc).
 *
 * @param {Player[]} players - Array of players
 * @param {PlayerStatsRow[]} stats - Array of player statistics
 * @returns {IndividualStanding[]} - Sorted array of player standings
 */
export function calculateIndividualStandings(
	players: Player[],
	stats: PlayerStatsRow[]
): IndividualStanding[] {
	const standings: IndividualStanding[] = [];

	for (const player of players) {
		// Get all stats for this player
		const playerStats = stats.filter((s) => s.player_id === player.id);

		// Calculate totals
		const wins = playerStats.filter((s) => s.win).length;
		const losses = playerStats.filter((s) => !s.win).length;
		const totalPoints = playerStats.reduce((sum, s) => sum + s.points_scored, 0);
		const pointsAllowed = playerStats.reduce((sum, s) => sum + s.points_allowed, 0);
		const pointsDiff = totalPoints - pointsAllowed;
		const matchesPlayed = playerStats.length;
		const winPercentage = matchesPlayed > 0 ? wins / matchesPlayed : 0;

		standings.push({
			player,
			wins,
			losses,
			pointsDiff,
			totalPoints,
			pointsAllowed,
			matchesPlayed,
			winPercentage
		});
	}

	// Sort by wins (descending), then points diff (descending), then total points (descending)
	return standings.sort((a, b) => {
		// Primary: wins
		if (b.wins !== a.wins) return b.wins - a.wins;

		// Tiebreaker 1: points differential
		if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;

		// Tiebreaker 2: total points scored
		return b.totalPoints - a.totalPoints;
	});
}

/**
 * Get players sorted by current standings (for seeding next round).
 *
 * @param {IndividualStanding[]} standings - Array of individual standings
 * @returns {Player[]} - Array of players sorted by standings
 */
export function seedPlayersForNextRound(standings: IndividualStanding[]): Player[] {
	return standings.map((s) => s.player);
}

/**
 * Calculate standings for a specific gender (for King & Queen tournaments).
 *
 * @param {Player[]} players - Array of all players
 * @param {PlayerStatsRow[]} stats - Array of player statistics
 * @param {string} gender - Gender to filter by ('male' or 'female')
 * @returns {IndividualStanding[]} - Sorted array of player standings for that gender
 */
export function calculateStandingsByGender(
	players: Player[],
	stats: PlayerStatsRow[],
	gender: string
): IndividualStanding[] {
	const genderPlayers = players.filter((p) => p.gender === gender);
	return calculateIndividualStandings(genderPlayers, stats);
}

/**
 * Get top N players from standings.
 *
 * @param {IndividualStanding[]} standings - Array of individual standings
 * @param {number} count - Number of top players to return
 * @returns {Player[]} - Array of top N players
 */
export function getTopPlayers(standings: IndividualStanding[], count: number): Player[] {
	return standings.slice(0, count).map((s) => s.player);
}

/**
 * Find a player's current rank in the standings.
 *
 * @param {IndividualStanding[]} standings - Array of individual standings
 * @param {number} playerId - ID of the player to find
 * @returns {number} - 1-indexed rank (1 = first place), or -1 if not found
 */
export function getPlayerRank(standings: IndividualStanding[], playerId: number): number {
	const index = standings.findIndex((s) => s.player.id === playerId);
	return index >= 0 ? index + 1 : -1;
}

/**
 * Calculate average points per match for a player.
 *
 * @param {IndividualStanding} standing - The player's standing data
 * @returns {number} - Average points scored per match
 */
export function calculateAvgPointsPerMatch(standing: IndividualStanding): number {
	if (standing.matchesPlayed === 0) return 0;
	return standing.totalPoints / standing.matchesPlayed;
}

/**
 * Format win percentage as a string.
 *
 * @param {number} winPercentage - Win percentage (0.0 to 1.0)
 * @returns {string} - Formatted percentage (e.g., "75.0%")
 */
export function formatWinPercentage(winPercentage: number): string {
	return `${(winPercentage * 100).toFixed(1)}%`;
}
