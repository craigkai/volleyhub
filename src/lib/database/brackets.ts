import { SupabaseDatabaseService } from '$lib/database/supabaseDatabaseService';
import type { PostgrestResponse } from '@supabase/supabase-js';
import { z } from 'zod';
import { bracketsRowSchema } from '../../types/schemas';

const BracketsRowSchemaArray = z.array(bracketsRowSchema);

type Filter = {
    column: string;
    operator: string;
    value: string;
};

export class BracketsSupabaseDatabaseService extends SupabaseDatabaseService {
    /**
     * Load all matches associated with a specific event from the database.
     * @param {string} event_id - The ID of the event whose matches to load.
     * @returns {Promise<MatchRow[]>} - Returns a promise that resolves to an array of the loaded matches.
     * @throws {Error} - Throws an error if there's an issue loading the matches.
     */
    async load(event_id: number, filter?: Filter): Promise<BracketRow[] | null> {
        const query = this.supabaseClient
            .from('brackets')
            .select('*, brackets_team1_fkey(name), brackets_team2_fkey(name)')
            .eq('event_id', event_id);

        if (filter) {
            query.filter(filter.column, filter.operator, filter.value);
        }

        // Load the matches from the 'matches' table
        const res: PostgrestResponse<BracketRow[]> = await query;

        this.validateAndHandleErrors(res, BracketsRowSchemaArray);

        // Return the loaded matches
        return res.data;
    }

    async deleteBracketMatchesByEvent(event_id: number): Promise<void> {
        const response = await this.supabaseClient.from('matches').delete().eq('event_id', event_id);
        this.handleDatabaseError(response);
    }

    async insertBracketMatches(matches: UserMatch[]): Promise<MatchRow[]> {
        const res = await this.supabaseClient
            .from('brackets')
            .insert(matches)
            .select('*, brackets_team1_fkey(name), brackets_team2_fkey(name)');

        this.validateAndHandleErrors(res, BracketsRowSchemaArray);

        return res.data ?? [];
    }

    async updateMatch(match: MatchRow): Promise<MatchRow | null> {
        const parsedMatch = bracketsRowSchema.parse(match);

        const res = await this.supabaseClient
            .from('brackets')
            .update(parsedMatch)
            .eq('id', match.id)
            .select('*, brackets_team1_fkey(name), brackets_team2_fkey(name)')
            .single();

        this.validateAndHandleErrors(res, bracketsRowSchema);

        return res.data;
    }
}
