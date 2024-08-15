import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import { z } from 'zod';
import { teamsRowSchema } from '$schemas/supabase';

// Schema validation for an array of teams
const TeamsRowSchemaArray = z.array(teamsRowSchema).refine((data) => Array.isArray(data), {
	message: 'Expected an array of teams.'
});

export class TeamsSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new team in the database or update an existing one.
	 * If the team already exists, it will be updated.
	 * @param {Partial<TeamRow>} team - The data for the team.
	 * @returns {Promise<TeamRow | null>} - Returns a promise that resolves to the newly created or updated team, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating or updating the team.
	 */
	async create(team: Partial<TeamRow>): Promise<TeamRow | null> {
		try {
			const res = await this.supabaseClient
				.from('teams')
				.insert({ ...team })
				.select()
				.single();

			// Validate the response using the Zod schema
			this.validateAndHandleErrors(res, teamsRowSchema);

			// Return the created or updated team data
			return res.data;
		} catch (error) {
			console.error('An error occurred while creating or updating the team:', error);
			throw new Error('Failed to create or update the team.');
		}
	}

	/**
	 * Load all teams associated with a specific event from the database.
	 * @param {number} event_id - The ID of the event whose teams to load.
	 * @returns {Promise<TeamRow[] | null>} - Returns a promise that resolves to an array of the loaded teams, or null if no teams were found.
	 * @throws {Error} - Throws an error if there's an issue loading the teams.
	 */
	async load(event_id: number): Promise<TeamRow[] | null> {
		try {
			// Load the teams from the 'teams' table where the event ID matches
			const res = await this.supabaseClient.from('teams').select('*').eq('event_id', event_id);

			// Validate the response using the Zod schema for an array
			this.validateAndHandleErrors(res, TeamsRowSchemaArray);

			// Return the loaded teams, or null if none were found
			return res.data;
		} catch (error) {
			console.error('An error occurred while loading the teams:', error);
			throw new Error('Failed to load teams.');
		}
	}
}
