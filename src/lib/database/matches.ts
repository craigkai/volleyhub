import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import type { Matches } from '$lib/matches';
import type {
	PostgrestResponse,
	PostgrestSingleResponse,
	RealtimeChannel,
	RealtimePostgresChangesPayload
} from '@supabase/supabase-js';
import { z } from 'zod';
import { matchesRowSchema } from '../../types/schemas';

const MatchesRowSchemaArray = z.array(matchesRowSchema);

type Filter = {
	column: string;
	operator: string;
	value: string;
};

export class MatchesSupabaseDatabaseService extends SupabaseDatabaseService {
	/**
	 * Load all matches associated with a specific event from the database.
	 * @param {string} event_id - The ID of the event whose matches to load.
	 * @returns {Promise<MatchRow[]>} - Returns a promise that resolves to an array of the loaded matches.
	 * @throws {Error} - Throws an error if there's an issue loading the matches.
	 */
	async loadMatches(event_id: number, filter?: Filter): Promise<MatchRow[] | null> {
		const query = this.supabaseClient
			.from('matches')
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name), matches_ref_fkey(name)')
			.eq('event_id', event_id);

		if (filter) {
			query.filter(filter.column, filter.operator, filter.value);
		}

		// Load the matches from the 'matches' table
		const res: PostgrestResponse<MatchRow[]> = await query;

		this.validateAndHandleErrors(res, MatchesRowSchemaArray);

		// Return the loaded matches
		return res.data;
	}

	async subscribeToChanges(
		self: Matches,
		callback: (
			self: Matches,
			payload: RealtimePostgresChangesPayload<{
				[key: string]: any;
			}>
		) => {},
		table: string,
		filter?: string
	): Promise<RealtimeChannel> {
		console.debug('Subscribing to changes');

		return this.supabaseClient
			.channel('*')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: table, filter: filter },
				(
					payload: RealtimePostgresChangesPayload<{
						[key: string]: any;
					}>
				) => {
					callback(self, payload);
				}
			)
			.subscribe((status) => {
				// We call the load function to update in case our content is stale
				// we we re-connect to the web socket.
				self.load();
				console.debug('Realtime status', status);
			});
	}

	async deleteMatchesByEvent(event_id: number): Promise<void> {
		const response = await this.supabaseClient.from('matches').delete().eq('event_id', event_id);
		this.handleDatabaseError(response);
	}

	async insertMatches(matches: UserMatch[]): Promise<MatchRow[]> {
		const res = await this.supabaseClient
			.from('matches')
			.insert(matches)
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name), matches_ref_fkey(name)');

		this.validateAndHandleErrors(res, MatchesRowSchemaArray);

		return res.data ?? [];
	}

	async updateMatch(match: MatchRow): Promise<MatchRow | null> {
		const parsedMatch = matchesRowSchema.parse(match);

		const res = await this.supabaseClient
			.from('matches')
			.update(parsedMatch)
			.eq('id', match.id)
			.select('*, matches_team1_fkey(name), matches_team2_fkey(name), matches_ref_fkey(name)')
			.single();

		this.validateAndHandleErrors(res, matchesRowSchema);

		return res.data;
	}
}