import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
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

export class MatchesSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load all matches associated with a specific event from the database.
	 * @param {string} event_id - The ID of the event whose matches to load.
	 * @returns {Promise<MatchRow[][]>} - Returns a promise that resolves to an array of the loaded matches.
	 * @throws {Error} - Throws an error if there's an issue loading the matches.
	 */
	async load(event_id: number, filter?: Filter): Promise<MatchRow[] | null> {
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

	async deleteMatchesByEvent(event_id: number): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().eq('event_id', event_id);
		this.handleDatabaseError(response);
	}

	async deleteMatchesByIds(ids: number[]): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().in('id', ids);
		this.handleDatabaseError(response);
	}

	async delete(id: number): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().eq('id', id);
		this.handleDatabaseError(response);
	}

	async insertMatch(match: Partial<MatchRow>): Promise<MatchRow> {
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

	async insertMatches(matches: Partial<MatchRow>[]): Promise<MatchRow[]> {
		const parsedMatches = z.array(matchesInsertSchema).parse(matches);

		const res = await this.supabaseClient
			.from('matches')
			.insert(parsedMatches)
			.select(MATCHES_SELECT_QUERY);

		this.validateAndHandleErrors(res, MatchesRowSchemaArray);

		return res.data ?? [];
	}

	async put(match: MatchRow): Promise<MatchRow | null> {
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
