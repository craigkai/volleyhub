import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService.svelte';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { z } from 'zod';
import { matchesRowSchema, matchesUpdateSchema, matchesInsertSchema } from '$schemas/supabase';

const MatchesRowSchemaArray = z.array(matchesRowSchema);

const MATCHES_SELECT_QUERY =
	'*, public_matches_team1_fkey(name), public_matches_team2_fkey(name), public_matches_ref_fkey(name)';

type Filter = {
	column: string;
	operator: string;
	value: string;
};

/**
 * MatchesSupabaseDatabaseService class for interacting with the 'matches' table in Supabase.
 */
export class MatchesSupabaseDatabaseService extends SupabaseDatabaseService {
	constructor() {
		super();
	}

	/**
	 * Load all matches associated with a specific event from the database.
	 * @param {number} event_id - The ID of the event whose matches to load.
	 * @param {Filter} [filter] - Optional filter to apply to the query.
	 * @returns {Promise<MatchRow[] | null>} - Returns a promise that resolves to an array of the loaded matches.
	 * @throws {Error} - Throws an error if there's an issue loading the matches.
	 */
	async load(event_id: number, filter?: Filter): Promise<MatchRow[] | null> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		const query = this.supabaseClient
			.from('matches')
			.select(MATCHES_SELECT_QUERY)
			.eq('event_id', event_id);

		if (filter) {
			query.filter(filter.column, filter.operator, filter.value);
		}

		// Load the matches from the 'matches' table
		const res: PostgrestResponse<MatchRow[]> = await query;

		this.validateAndHandleErrors(res, MatchesRowSchemaArray);

		// Return the loaded matches
		return res.data as unknown as MatchRow[];
	}

	/**
	 * Delete all matches associated with a specific event.
	 * @param {number} event_id - The ID of the event whose matches to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the matches are deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the matches.
	 */
	async deleteMatchesByEvent(event_id: number): Promise<void> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		const response = await this.supabaseClient.from('matches').delete().eq('event_id', event_id);
		this.handleDatabaseError(response);
	}

	/**
	 * Delete matches by their IDs.
	 * @param {number[]} ids - An array of IDs of the matches to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the matches are deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the matches.
	 */
	async deleteMatchesByIds(ids: number[]): Promise<void> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		const response = await this.supabaseClient.from('matches').delete().in('id', ids);
		this.handleDatabaseError(response);
	}

	/**
	 * Delete a match by its ID.
	 * @param {number} id - The ID of the match to delete.
	 * @returns {Promise<void>} - Returns a promise that resolves when the match is deleted.
	 * @throws {Error} - Throws an error if there's an issue deleting the match.
	 */
	async delete(id: number): Promise<void> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		const response = await this.supabaseClient.from('matches').delete().eq('id', id);
		this.handleDatabaseError(response);
	}

	/**
	 * Insert a single match into the database.
	 * @param {Partial<MatchRow>} match - The match data to insert.
	 * @returns {Promise<MatchRow>} - Returns a promise that resolves to the inserted match.
	 * @throws {Error} - Throws an error if there's an issue inserting the match.
	 */
	async insertMatch(match: Partial<MatchRow>): Promise<MatchRow> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		try {
			const matches = await this.insertMatches([match]);

			if (matches.length === 0) {
				throw new Error('Failed to insert match');
			}

			return matches[0];
		} catch (err) {
			throw new Error(`Failed to insert match: ${(err as Error).message}`);
		}
	}

	/**
	 * Insert multiple matches into the database.
	 * @param {Partial<MatchRow>[]} matches - An array of match data to insert.
	 * @returns {Promise<MatchRow[]>} - Returns a promise that resolves to an array of inserted matches.
	 * @throws {Error} - Throws an error if there's an issue inserting the matches.
	 */
	async insertMatches(matches: Partial<MatchRow>[]): Promise<MatchRow[]> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		const parsedMatches = z.array(matchesInsertSchema).parse(matches);

		const res = await this.supabaseClient
			.from('matches')
			.insert(parsedMatches)
			.select(MATCHES_SELECT_QUERY);

		this.validateAndHandleErrors(res, MatchesRowSchemaArray);

		return res.data ?? [];
	}

	/**
	 * Update a match in the database.
	 * @param {MatchRow} match - The match data to update.
	 * @returns {Promise<MatchRow | null>} - Returns a promise that resolves to the updated match.
	 * @throws {Error} - Throws an error if there's an issue updating the match.
	 */
	async put(match: MatchRow): Promise<MatchRow | null> {
		if (!this.supabaseClient) throw new Error('Supabase client not provided.');

		const parsedMatch = matchesUpdateSchema.parse(match);

		const res = await this.supabaseClient
			.from('matches')
			.update(parsedMatch)
			.eq('id', match.id)
			.select(MATCHES_SELECT_QUERY)
			.single();

		this.validateAndHandleErrors(res, matchesRowSchema);

		return res.data as MatchRow;
	}
}

export const MatchesSupabaseDatabaseServiceInstance = new MatchesSupabaseDatabaseService();
