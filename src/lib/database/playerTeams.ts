import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import { z } from 'zod';
import { playerTeamsRowSchema, playerTeamsInsertSchema } from '$schemas/supabase';

// Schema validation for an array of player_teams
const PlayerTeamsRowSchemaArray = z.array(playerTeamsRowSchema).refine((data) => Array.isArray(data), {
	message: 'Expected an array of player_teams.'
});

export class PlayerTeamsSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new player_team record in the database.
	 * @param {Partial<PlayerTeamRow>} playerTeam - The data for the player_team record.
	 * @returns {Promise<PlayerTeamRow | null>} - Returns a promise that resolves to the newly created record, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating the record.
	 */
	async create(playerTeam: Partial<PlayerTeamRow>): Promise<PlayerTeamRow | null> {
		try {
			const res = await this.supabaseClient
				.from('player_teams')
				.insert({ ...playerTeam })
				.select()
				.single();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, playerTeamsRowSchema);

			// Return the created record data
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating the player_team record:', error);
			throw new Error('Failed to create the player_team record.');
		}
	}

	/**
	 * Create multiple player_team records in a single operation.
	 * @param {Partial<PlayerTeamRow>[]} playerTeams - Array of player_team records to create.
	 * @returns {Promise<PlayerTeamRow[] | null>} - Returns a promise that resolves to the created records.
	 * @throws {Error} - Throws an error if there's an issue creating the records.
	 */
	async createMany(playerTeams: Partial<PlayerTeamRow>[]): Promise<PlayerTeamRow[] | null> {
		try {
			const res = await this.supabaseClient
				.from('player_teams')
				.insert(playerTeams)
				.select();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, PlayerTeamsRowSchemaArray);

			// Return the created records
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating player_team records:', error);
			throw new Error('Failed to create player_team records.');
		}
	}

	/**
	 * Load all player_teams associated with a specific team from the database.
	 * @param {number} team_id - The ID of the team whose player associations to load.
	 * @returns {Promise<PlayerTeamRow[] | null>} - Returns a promise that resolves to an array of the loaded records, or null if none were found.
	 * @throws {Error} - Throws an error if there's an issue loading the records.
	 */
	async loadByTeam(team_id: number): Promise<PlayerTeamRow[] | null> {
		try {
			const res = await this.supabaseClient
				.from('player_teams')
				.select('*')
				.eq('team_id', team_id);

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, PlayerTeamsRowSchemaArray);

			// Return the loaded records, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the player_teams:', error);
			throw new Error('Failed to load player_teams.');
		}
	}

	/**
	 * Load all player_teams associated with a specific player from the database.
	 * @param {number} player_id - The ID of the player whose team associations to load.
	 * @returns {Promise<PlayerTeamRow[] | null>} - Returns a promise that resolves to an array of the loaded records, or null if none were found.
	 * @throws {Error} - Throws an error if there's an issue loading the records.
	 */
	async loadByPlayer(player_id: number): Promise<PlayerTeamRow[] | null> {
		try {
			const res = await this.supabaseClient
				.from('player_teams')
				.select('*')
				.eq('player_id', player_id);

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, PlayerTeamsRowSchemaArray);

			// Return the loaded records, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the player_teams:', error);
			throw new Error('Failed to load player_teams.');
		}
	}

	/**
	 * Delete all player_team records for a specific team.
	 * @param {number} team_id - The ID of the team.
	 * @returns {Promise<void>}
	 * @throws {Error} - Throws an error if there's an issue deleting the records.
	 */
	async deleteByTeam(team_id: number): Promise<void> {
		try {
			const res = await this.supabaseClient
				.from('player_teams')
				.delete()
				.eq('team_id', team_id);

			if (res.error) {
				throw new Error(res.error.message);
			}
		} catch (error) {
			console.error('An error occurred while deleting player_team records:', error);
			throw new Error('Failed to delete player_team records.');
		}
	}
}
