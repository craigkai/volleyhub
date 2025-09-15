import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { z } from 'zod';
import { matchesRowSchema, matchesInsertSchema } from '$schemas/supabase';

const MatchesRowSchemaArray = z.array(matchesRowSchema);

const MATCHES_SELECT_QUERY = '*';

type Filter = {
	column: string;
	operator: string;
	value: string;
};

export class MatchesSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load all matches associated with a specific event from the database.
	 * @param {string} eventId - The ID of the event whose matches to load.
	 * @returns {Promise<MatchRow[][]>} - Returns a promise that resolves to an array of the loaded matches.
	 * @throws {Error} - Throws an error if there's an issue loading the matches.
	 */
	async load(eventId: number, filter?: Filter): Promise<MatchRow[] | null> {
		const query = this.supabaseClient
			.from('matches')
			.select(MATCHES_SELECT_QUERY)
			.eq('event_id', eventId);

		if (filter) {
			query.filter(filter.column, filter.operator, filter.value);
		}

		// Load the matches from the 'matches' table
		const res: PostgrestResponse<MatchRow[]> = await query;

		this.validateAndHandleErrors(res, MatchesRowSchemaArray);

		// Return the loaded matches
		return res.data;
	}

	async deleteMatchesByEvent(eventId: number): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().eq('event_id', eventId);
		this.handleDatabaseError(response);
	}

	async deleteMatchesByIds(ids: number[]): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().in('id', ids);
		this.handleDatabaseError(response);
	}

	async deleteMatchesByRound(eventId: number, round: number): Promise<void> {
		const response = await this.supabaseClient
			.from('matches')
			.delete()
			.eq('event_id', eventId)
			.eq('round', round);
		this.handleDatabaseError(response);
	}

	async deleteMatchesFromRound(eventId: number, fromRound: number): Promise<void> {
		const response = await this.supabaseClient
			.from('matches')
			.delete()
			.eq('event_id', eventId)
			.gte('round', fromRound);
		this.handleDatabaseError(response);
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
}
