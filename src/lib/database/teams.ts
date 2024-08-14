import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { z } from 'zod';
import { teamsRowSchema } from '$schemas/supabase';

const TeamsRowSchemaArray = z.array(teamsRowSchema);

export class TeamsSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new team in the database or update an existing one.
	 * @param {Partial<Team>} team - The data for the team.
	 * @returns {Promise<Team>} - Returns a promise that resolves to the newly created or updated team.
	 * @throws {Error} - Throws an error if there's an issue creating or updating the team.
	 */
	async create(team: Partial<TeamRow>): Promise<TeamRow | null> {
		const res = await this.supabaseClient
			.from('teams')
			.insert({ ...team })
			.select()
			.single();

		this.validateAndHandleErrors(res, teamsRowSchema);

		return res.data;
	}

	/**
	 * Load all teams associated with a specific event from the database.
	 * @param {string} event_id - The ID of the event whose teams to load.
	 * @returns {Promise<TeamRow[]>} - Returns a promise that resolves to an array of the loaded teams.
	 * @throws {Error} - Throws an error if there's an issue loading the teams.
	 */
	async load(event_id: number): Promise<TeamRow[] | null> {
		try {
			// Load the teams from the 'teams' table
			const res: PostgrestResponse<TeamRow> = await this.supabaseClient
				.from('teams')
				.select('*')
				.eq('event_id', event_id);

			// @ts-ignore
			this.validateAndHandleErrors(res, TeamsRowSchemaArray);

			// Return the loaded teams
			return res.data as TeamRow[]; // Consider additional checks here
		} catch (error) {
			// If an error occurs while loading the teams, log it and rethrow it
			console.error('An error occurred while loading the teams:', error);
			throw error;
		}
	}
}
