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
    pools?: string;
    courts?: string;
    date?: string;

    constructor(handle: supabaseClient) {
        this.handle = handle;
    }

    /*
    Create a new `tournament` (event)
    */
    async createTournament(input: { name: string; teams: string[]; pools: number; courts: number; date: string }): Promise<Tournament | HttpError> {
        if (!input.teams || !input.pools || !input.courts) {
            throw error(400, `Tournament create call does not have all required values`);
        }

        const ownerId = (await this.handle.auth.getUser()).data.user?.id;

        const res: PostgrestSingleResponse<MemberType> = await this.handle
            .from('events')
            .insert([
                {
                    owner: ownerId,
                    name: input.name,
                    teams: input.teams,
                    pools: input.pools,
                    courts: input.courts,
                    date: input.date
                },
            ])
            .select();

        if (res.error) {
            throw error(400, res.error);
        }

        this.id = res.data.id;
        this.teams = res.data.teams;
        this.name = res.data.name;
        this.pools = res.data.pools;
        this.courts = res.data.courts;
        return this;
    }

    async updateTournament(input: { id: string, name: string; teams: string[]; pools: string; courts: string; date: string }): Promise<Tournament | HttpError> {
        if (!input.teams || !input.pools || !input.courts) {
            throw error(400, `Tournament create call does not have all required values`);
        }

        const res: PostgrestSingleResponse<MemberType> = await this.handle
            .from('events')
            .update({ name: input.name, teams: input.teams, pools: input.pools, courts: input.courts, date: input.date })
            .eq('id', input.id)
            .select();

        if (res.error) {
            throw error(400, res.error);
        }

        this.teams = input.teams;
        this.name = input.name;
        this.pools = input.pools;
        this.courts = input.courts;

        return this;
    }

    async saveTournament() {
        throw new Error('Function not implemented.');
    }

    /*
    Attempt to load our tournament via SupaBase.
    */
    async loadTournament(eventId?: string): Promise<Tournament | HttpError> {
        if (!eventId) {
            throw error(400, 'Invalid event ID, are you sure your link is correct?');
        }

        const res = await this.handle
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()
            .then((res: PostgrestSingleResponse<MemberType>) => {
                if (res?.error) {
                    throw error(res?.status, res?.error.details);
                }
                return res.data;
            });
        this.id = res.id;
        this.teams = res.teams;
        this.name = res.name;
        this.pools = res.pools;
        this.courts = res.courts;

        return this;
    }

    /**
     * Insert new match.
    */
    async saveMatch() {

    }

    async createMatches() {
        self.matches = RoundRobin(self.teams)
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
