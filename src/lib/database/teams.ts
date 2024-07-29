import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { z } from 'zod';
import { teamsRowSchema } from '$schemas/supabase';

const TeamsRowSchemaArray = z.array(teamsRowSchema);

export class TeamsSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new team in the database or update an existing one.
	 * @param {Partial<TeamRow>} team - The data for the team.
	 * @returns {Promise<TeamRow>} - Returns a promise that resolves to the newly created or updated team.
	 * @throws {Error} - Throws an error if there's an issue creating or updating the team.
	 */
	async createTeam(team: Partial<TeamRow>): Promise<TeamRow | null> {
		const res = await this.supabaseClient
			.from('teams')
			.insert({ ...team })
			.select()
			.single();

		this.validateAndHandleErrors(res, teamsRowSchema);

		// Return the newly created or updated team
		return res.data as unknown as TeamRow;
	}

	async deleteTeam(team: TeamRow): Promise<void> {
		const res = await this.supabaseClient.from('teams').delete().eq('id', team.id);
		this.handleDatabaseError(res);
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

	/**
	 * Update an existing team in the database.
	 * @param {TeamRow} team - The team to update.
	 * @returns {Promise<TeamRow>} - Returns a promise that resolves to the updated team.
	 * @throws {Error} - Throws an error if there's an issue updating the team.
	 */
	async put(team: TeamRow): Promise<TeamRow | null> {
		const res = await this.supabaseClient
			.from('teams')
			.update({ ...team })
			.eq('id', team.id)
			.select()
			.single();

		this.validateAndHandleErrors(res, teamsRowSchema);

		// Return the updated team
		return res.data as unknown as TeamRow;
	}
}
