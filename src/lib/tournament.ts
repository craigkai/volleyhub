import { error, type HttpError } from '@sveltejs/kit';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { RoundRobin } from 'tournament-pairings';
import type { Match } from 'tournament-pairings/dist/Match';

export class Tournament {
    handle: supabaseClient;
    matches?: Match[];
    teams?: string[];
    id?: string;
    status?: string;
    name?: string;

    constructor(handle: supabaseClient) {
        this.handle = handle;
    }

    async saveTournament() {
        throw new Error('Function not implemented.');
    }

    /*
    Create our Tournament object
    */
    async createTournament(input: { teams: string[]; pools: number; courts: number }) {
        if (!input.teams || !input.pools || !input.courts) {
            throw error(400, `Tournament create call does not have all required values`);
        }

        this.matches = RoundRobin(input.teams);
        this.id = '1';
        this.status = 'Started';
        this.teams = input.teams;
    }

    /*
    Attempt to load our tournament via SupaBase.
    */
    async loadTournament(eventId?: string, eventName?: string): Promise<void | HttpError> {
        if (!eventId && !eventName) {
            throw error(400, 'Invalid event ID/Name, are you sure your link is correct?');
        }

        this.handle
            .from('events')
            .select('*')
            .or(`id.eq.${eventId},name.eq.${eventName}`)
            .single()
            .then((res: PostgrestSingleResponse<MemberType>) => {
                if (res?.error) {
                    throw error(res?.status, res?.error.details);
                }
                this.id = res.data.id;
                this.teams = res.data.teams;
            });
    }

    /*
    Either adding updating match metadata such as teams in the match or adding results.
    */
    async updateMatch() {
        throw new Error('Function not implemented.');
    }

    /*
    Update tournament teams.
    
    */

    async updateTournamentTeams({
        eventId,
        teams
    }: {
        eventId: string;
        teams: string[];
    }): Promise<void> {
        throw new Error('Function not implemented.');
    }
}
