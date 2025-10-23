import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import { z } from 'zod';
import { playerStatsRowSchema } from '$schemas/playerSchema';

// Schema validation for an array of player stats
const PlayerStatsRowSchemaArray = z.array(playerStatsRowSchema).refine((data) => Array.isArray(data), {
	message: 'Expected an array of player stats.'
});

export class PlayerStatsSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load all player stats for a specific event from the database.
	 * @param {number} event_id - The ID of the event whose player stats to load.
	 * @returns {Promise<PlayerStatsRow[] | null>} - Returns a promise that resolves to an array of the loaded player stats, or null if none were found.
	 * @throws {Error} - Throws an error if there's an issue loading the player stats.
	 */
	async loadByEvent(event_id: number): Promise<PlayerStatsRow[] | null> {
		try {
			const res = await this.supabaseClient
				.from('player_stats')
				.select('*')
				.eq('event_id', event_id)
				.order('created_at', { ascending: false });

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, PlayerStatsRowSchemaArray);

			// Return the loaded player stats, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading player stats for event:', error);
			throw new Error('Failed to load player stats for event.');
		}
	}

	/**
	 * Load all stats for a specific player.
	 * @param {number} player_id - The ID of the player whose stats to load.
	 * @returns {Promise<PlayerStatsRow[] | null>} - Returns a promise that resolves to an array of the player's stats, or null if none were found.
	 * @throws {Error} - Throws an error if there's an issue loading the player stats.
	 */
	async loadByPlayer(player_id: number): Promise<PlayerStatsRow[] | null> {
		try {
			const res = await this.supabaseClient
				.from('player_stats')
				.select('*')
				.eq('player_id', player_id)
				.order('created_at', { ascending: false });

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, PlayerStatsRowSchemaArray);

			// Return the loaded player stats, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading stats for player:', error);
			throw new Error('Failed to load stats for player.');
		}
	}

	/**
	 * Create multiple player stats records in a single batch.
	 * @param {Partial<PlayerStatsRow>[]} stats - An array of player stats to insert.
	 * @returns {Promise<PlayerStatsRow[] | null>} - Returns a promise that resolves to the created player stats, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating the player stats.
	 */
	async createBatch(stats: Partial<PlayerStatsRow>[]): Promise<PlayerStatsRow[] | null> {
		try {
			const res = await this.supabaseClient.from('player_stats').insert(stats).select();

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, PlayerStatsRowSchemaArray);

			// Return the created player stats
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating player stats batch:', error);
			throw new Error('Failed to create player stats batch.');
		}
	}

	/**
	 * Create a single player stats record.
	 * @param {Partial<PlayerStatsRow>} stat - The player stat data to create.
	 * @returns {Promise<PlayerStatsRow | null>} - Returns a promise that resolves to the created player stat, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating the player stat.
	 */
	async create(stat: Partial<PlayerStatsRow>): Promise<PlayerStatsRow | null> {
		try {
			const res = await this.supabaseClient.from('player_stats').insert(stat).select().single();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, playerStatsRowSchema);

			// Return the created player stat
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating player stat:', error);
			throw new Error('Failed to create player stat.');
		}
	}
}
