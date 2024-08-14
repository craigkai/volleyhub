import { SupabaseDatabaseService } from './supabaseDatabaseService';
import { matchesRowSchema, matchesUpdateSchema } from '$schemas/supabase';
import type { Match } from '$lib/match.svelte';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export class MatchSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load a match by its ID from the database.
	 * @param {number} id - The ID of the match.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the loaded match, or null if not found.
	 * @throws {Error} - Throws an error if there's an issue loading the match.
	 */
	async load(id: number): Promise<MatchRow | null> {
		try {
			const res: PostgrestSingleResponse<MatchRow> = await this.supabaseClient
				.from('matches')
				.select('*')
				.eq('id', id)
				.single();

			this.validateAndHandleErrors(res, matchesRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error loading the match:', error);
			throw new Error('Failed to load match.');
		}
	}

	/**
	 * Delete a match from the database by its ID.
	 * @param {number} id - The ID of the match to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the match is deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the match.
	 */
	async delete(id: number): Promise<void> {
		try {
			const response = await this.supabaseClient.from('matches').delete().eq('id', id);
			this.handleDatabaseError(response);
		} catch (error) {
			console.error('Error deleting the match:', error);
			throw new Error('Failed to delete match.');
		}
	}

	/**
	 * Insert a new match into the database.
	 * @param {Match} match - The match data to insert.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the inserted match, or null if the insertion fails.
	 * @throws {Error} - Throws an error if there's an issue inserting the match.
	 */
	async insert(match: Match): Promise<MatchRow | null> {
		try {
			const parsedMatch = matchesUpdateSchema.parse(match);

			const res: PostgrestSingleResponse<MatchRow> = await this.supabaseClient
				.from('matches')
				.insert(parsedMatch)
				.select()
				.single();

			this.validateAndHandleErrors(res, matchesRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error inserting the match:', error);
			throw new Error('Failed to insert match.');
		}
	}

	/**
	 * Update an existing match in the database.
	 * @param {Match} match - The match data to update.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the updated match, or null if the update fails.
	 * @throws {Error} - Throws an error if there's an issue updating the match.
	 */
	async put(match: Match): Promise<MatchRow | null> {
		try {
			const parsedMatch = matchesUpdateSchema.parse(match);

			const res: PostgrestSingleResponse<MatchRow> = await this.supabaseClient
				.from('matches')
				.update(parsedMatch)
				.eq('id', match.id)
				.select('*')
				.single();

			this.validateAndHandleErrors(res, matchesRowSchema);

			return res.data;
		} catch (error) {
			console.error('Error updating the match:', error);
			throw new Error('Failed to update match.');
		}
	}
}
