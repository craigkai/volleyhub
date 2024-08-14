import { teamsRowSchema } from '$schemas/supabase';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { SupabaseDatabaseService } from './supabaseDatabaseService';
import type { Team } from '$lib/team.svelte';

export class TeamSupabaseDatabaseService extends SupabaseDatabaseService {
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

	async deleteTeam(team: Team): Promise<void> {
		const res = await this.supabaseClient.from('teams').delete().eq('id', team.id);
		this.handleDatabaseError(res);
	}

	/**
	 * Load all teams associated with a specific event from the database.
	 * @param {string} id - The ID of the event whose teams to load.
	 * @returns {Promise<TeamRow>} - Returns a promise that resolves to the loaded team.
	 * @throws {Error} - Throws an error if there's an issue loading the teams.
	 */
	async load(id: number): Promise<TeamRow | null> {
		try {
			// Load the teams from the 'teams' table
			const res: PostgrestResponse<Team> = await this.supabaseClient
				.from('teams')
				.select('*')
				.eq('id', id)
				.select()
				.single();

			// @ts-ignore
			this.validateAndHandleErrors(res, teamsRowSchema);

			// Return the loaded teams
			return res.data;
		} catch (error) {
			// If an error occurs while loading the teams, log it and rethrow it
			console.error('An error occurred while loading the teams:', error);
			throw error;
		}
	}

	/**
	 * Update an existing team in the database.
	 * @param {Team} team - The team to update.
	 * @returns {Promise<TeamRow>} - Returns a promise that resolves to the updated team.
	 * @throws {Error} - Throws an error if there's an issue updating the team.
	 */
	async put(team: Team): Promise<TeamRow | null> {
		const res = await this.supabaseClient
			.from('teams')
			.update({ ...team })
			.eq('id', team.id)
			.select()
			.single();

		this.validateAndHandleErrors(res, teamsRowSchema);

		// Return the updated team
		return res.data;
	}
}
