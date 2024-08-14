import { teamsRowSchema } from '$schemas/supabase';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { SupabaseDatabaseService } from './supabaseDatabaseService';
import type { Team } from '$lib/team.svelte';

export class TeamSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Create a new team in the database or update an existing one.
	 * @param {Partial<TeamRow>} team - The data for the team.
	 * @returns {Promise<TeamRow | null>} - Returns a promise that resolves to the newly created or updated team, or null if the operation fails.
	 * @throws {Error} - Throws an error if there's an issue creating or updating the team.
	 */
	async create(team: Partial<TeamRow>): Promise<TeamRow | null> {
		try {
			const res: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
				.from('teams')
				.insert({ ...team })
				.select()
				.single();

			this.validateAndHandleErrors(res, teamsRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error creating or updating the team:', error);
			throw new Error('Failed to create or update the team.');
		}
	}

	/**
	 * Delete a team from the database.
	 * @param {Team} team - The team to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the team is deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the team.
	 */
	async delete(team: Team): Promise<void> {
		try {
			const res = await this.supabaseClient.from('teams').delete().eq('id', team.id);
			this.handleDatabaseError(res);
		} catch (error) {
			console.error('Error deleting the team:', error);
			throw new Error('Failed to delete the team.');
		}
	}

	/**
	 * Load a team by its ID from the database.
	 * @param {number} id - The ID of the team to load.
	 * @returns {Promise<TeamRow | null>} - Returns a promise that resolves to the loaded team, or null if not found.
	 * @throws {Error} - Throws an error if there's an issue loading the team.
	 */
	async load(id: number): Promise<TeamRow | null> {
		try {
			const res: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
				.from('teams')
				.select('*')
				.eq('id', id)
				.single();

			this.validateAndHandleErrors(res, teamsRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error loading the team:', error);
			throw new Error('Failed to load the team.');
		}
	}

	/**
	 * Update an existing team in the database.
	 * @param {Team} team - The team to update.
	 * @returns {Promise<TeamRow | null>} - Returns a promise that resolves to the updated team, or null if the update fails.
	 * @throws {Error} - Throws an error if there's an issue updating the team.
	 */
	async put(team: Team): Promise<TeamRow | null> {
		try {
			// Validate the team data against the schema
			const parsedTeam = teamsRowSchema.partial().parse(team);

			const res: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
				.from('teams')
				.update(parsedTeam)
				.eq('id', team.id)
				.select()
				.single();

			this.validateAndHandleErrors(res, teamsRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error updating the team:', error);
			throw new Error('Failed to update the team.');
		}
	}
}
