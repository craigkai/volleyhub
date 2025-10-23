import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import { z } from 'zod';
import { playerRowSchema } from '$schemas/playerSchema';

// Schema validation for an array of players
const PlayersRowSchemaArray = z.array(playerRowSchema).refine((data) => Array.isArray(data), {
	message: 'Expected an array of players.'
});

export class PlayersSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new player in the database.
	 * @param {Partial<PlayerRow>} player - The data for the player.
	 * @returns {Promise<PlayerRow | null>} - Returns a promise that resolves to the newly created player, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating the player.
	 */
	async create(player: Partial<PlayerRow>): Promise<PlayerRow | null> {
		try {
			const res = await this.supabaseClient
				.from('players')
				.insert({ ...player })
				.select()
				.single();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, playerRowSchema);

			// Return the created player data
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating the player:', error);
			throw new Error('Failed to create the player.');
		}
	}

	/**
	 * Load all players associated with a specific event from the database.
	 * @param {number} event_id - The ID of the event whose players to load.
	 * @returns {Promise<PlayerRow[] | null>} - Returns a promise that resolves to an array of the loaded players, or null if no players were found.
	 * @throws {Error} - Throws an error if there's an issue loading the players.
	 */
	async load(event_id: number): Promise<PlayerRow[] | null> {
		try {
			// Load the players from the 'players' table where the event ID matches and state is active
			const res = await this.supabaseClient
				.from('players')
				.select('*')
				.eq('event_id', event_id)
				.eq('state', 'active');

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, PlayersRowSchemaArray);

			// Return the loaded players, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the players:', error);
			throw new Error('Failed to load players.');
		}
	}
}
