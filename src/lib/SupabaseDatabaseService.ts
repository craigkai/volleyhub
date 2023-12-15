import type { PostgrestSingleResponse, PostgrestResponse, User } from '@supabase/supabase-js';
import type { Tournament } from './tournament';
import { error, type NumericRange } from '@sveltejs/kit';

export interface DatabaseService {
    handleDatabaseError<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): void;
    createEvent(input: EventRow, ownerId: string): Promise<EventRow>;
    updateTournament(id: string, input: EventRow): Promise<Tournament>;
    getCurrentUser(): Promise<User>;
    loadEvent(eventId: string): Promise<EventRow>;
    loadTeams(eventId: string): Promise<TeamRow[]>;
    deleteEvent(eventId: string): Promise<void>;
    deleteTeam(team: TeamRow): Promise<void>;
    loadMatches(eventId: string): Promise<MatchRow[]>;
    createTeam(team: TeamRow): Promise<TeamRow>;
    deleteMatchesByEvent(eventId: string): Promise<void>;
    insertMatches(matches: MatchRow[]): Promise<MatchRow[]>;
}

export class SupabaseDatabaseService implements DatabaseService {
    private supabaseClient: supabaseClient;

    constructor(supabaseClient: supabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    handleDatabaseError<T>(response: PostgrestSingleResponse<T> | PostgrestResponse<T>): void {
        if (response.error) {
            console.error(`Failed operation with status ${response.status}: ${response.error.message}`);
            console.error(response.error); // Log the error details
            error(response.status as NumericRange<400, 599>, response.error);
        }
    }

    /**
     * Get the UserResponse object for the current auth'd user for the supabase client.
     * @returns Promise<User>
     */
    async getCurrentUser(): Promise<User> {
        try {
            const response = await this.supabaseClient.auth.getUser();
            if (response.error) {
                console.error(`Failed to get current user: ${response.error}`);
                error(500, response.error);
            }
            return response?.data.user;
        } catch (error) {
            console.error('An error occurred while getting the current user:', error);
            throw error;
        }
    }

    async createEvent(input: EventRow, ownerId: string): Promise<EventRow> {
        const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
            .from('events')
            .insert({
                owner: ownerId,
                name: input.name,
                pools: input.pools,
                courts: input.courts,
                date: input.date
            })
            .select()
            .single();

        this.handleDatabaseError(res);
        return res.data;
    }

    /**
     * @param id The id of the tournament (event) being updated
     * @param input Settings for this event row
     * @returns Promise<EventRow>
     */
    async updateTournament(id: string, input: EventRow): Promise<EventRow> {
        const res: PostgrestSingleResponse<EventRow> = await this.supabaseClient
            .from('events')
            .update({
                name: input.name,
                pools: input.pools,
                courts: input.courts,
                date: input.date
            })
            .eq('id', id)
            .select();

        this.handleDatabaseError(res);
        return res.data;
    }

    async loadEvent(eventId: string): Promise<EventRow> {
        const response: PostgrestSingleResponse<EventRow> = await this.supabaseClient
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        this.handleDatabaseError(response);
        return response.data;
    }

    async loadTeams(eventId: string): Promise<TeamRow[]> {
        const response: PostgrestResponse<TeamRow> = await this.supabaseClient
            .from('teams')
            .select()
            .eq('event_id', eventId);
        this.handleDatabaseError(response);

        return response.data ?? [];
    }

    async deleteEvent(eventId: string) {
        const response: PostgrestSingleResponse<EventRow> = await this.supabaseClient
            .from('events')
            .delete()
            .eq('id', eventId);
        this.handleDatabaseError(response);
    }

    async deleteTeam(team: TeamRow): Promise<void> {
        const res: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
            .from('teams')
            .delete()
            .eq('id', team.id);
        this.handleDatabaseError(res);
    }

    async loadMatches(eventId: string): Promise<MatchRow[]> {
        const response: PostgrestSingleResponse<MatchRow> = await this.supabaseClient
            .from('matches')
            .select('*, matches_team1_fkey(name), matches_team2_fkey(name)')
            .eq('event_id', eventId);

        this.handleDatabaseError(response);
        return response.data;
    }

    async createTeam(team: TeamRow): Promise<TeamRow> {
        const response: PostgrestSingleResponse<TeamRow> = await this.supabaseClient
            .from('teams')
            .upsert({ ...team })
            .select();
        this.handleDatabaseError(response);
        return response.data;
    }

    async loadEvents(ownerId: string): Promise<EventRow[]> {
        const response = await this.supabaseClient.from('events').select('*').eq('owner', ownerId);
        this.handleDatabaseError(response);

        return response.data ?? [];
    }

    async deleteMatchesByEvent(eventId: string): Promise<void> {
        const response = await this.supabaseClient.from('matches').delete().eq('event_id', eventId);
        this.handleDatabaseError(response);
    }

    async insertMatches(matches: MatchRow[]): Promise<MatchRow[]> {
        const response = await this.supabaseClient
            .from('matches')
            .insert(matches)
            .select('*, matches_team1_fkey(name), matches_team2_fkey(name)');

        this.handleDatabaseError(response);
        return response.data ?? [];
    }
}
