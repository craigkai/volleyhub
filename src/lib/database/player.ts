import { playerRowSchema } from '$schemas/playerSchema';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { SupabaseDatabaseService } from './supabaseDatabaseService';
import type { Player } from '$lib/player.svelte';

export class PlayerSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load a player by its ID from the database.
	 * @param {number} id - The ID of the player to load.
	 * @returns {Promise<PlayerRow | null>} - Returns a promise that resolves to the loaded player, or null if not found.
	 * @throws {Error} - Throws an error if there's an issue loading the player.
	 */
	async load(id: number): Promise<PlayerRow | null> {
		try {
			const res: PostgrestSingleResponse<PlayerRow | null> = await this.supabaseClient
				.from('players')
				.select('*')
				.eq('id', id)
				.maybeSingle();

			this.validateAndHandleErrors(res, playerRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error loading the player:', error);
			throw new Error('Failed to load the player.');
		}
	}

	/**
	 * Create a new player in the database.
	 * @param {Partial<PlayerRow>} player - The data for the player.
	 * @returns {Promise<PlayerRow | null>} - Returns a promise that resolves to the newly created player, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating the player.
	 */
	async create(player: Partial<PlayerRow>): Promise<PlayerRow | null> {
		try {
			const res: PostgrestSingleResponse<PlayerRow | null> = await this.supabaseClient
				.from('players')
				.insert({ ...player })
				.select()
				.maybeSingle();

			this.validateAndHandleErrors(res, playerRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error creating the player:', error);
			throw new Error('Failed to create the player.');
		}
	}

	/**
	 * Delete a player from the database.
	 * @param {Player} player - The player to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the player is deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the player.
	 */
	async delete(player: Player): Promise<void> {
		try {
			const res = await this.supabaseClient.from('players').delete().eq('id', player.id);
			this.handleDatabaseError(res);
		} catch (error) {
			console.error('Error deleting the player:', error);
			throw new Error('Failed to delete the player.');
		}
	}

	/**
	 * Update an existing player in the database.
	 * @param {Player} player - The player to update.
	 * @returns {Promise<PlayerRow | null>} - Returns a promise that resolves to the updated player, or null if the update fails.
	 * @throws {Error} - Throws an error if there's an issue updating the player.
	 */
	async put(player: Player): Promise<PlayerRow | null> {
		try {
			// Validate the player data against the schema
			const parsedPlayer = playerRowSchema.partial().parse(player);

			const res: PostgrestSingleResponse<PlayerRow | null> = await this.supabaseClient
				.from('players')
				.update(parsedPlayer)
				.eq('id', player.id)
				.select()
				.maybeSingle();

			this.validateAndHandleErrors(res, playerRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error updating the player:', error);
			throw new Error('Failed to update the player.');
		}
	}
}
