import { error, type HttpError } from '@sveltejs/kit';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { RoundRobin } from 'tournament-pairings';
import type { Match } from 'tournament-pairings/dist/Match';

type TournamentSettings = {
    teams?: string[];
    status?: string;
    name?: string;
    pools?: string;
    courts?: string;
    date?: string;
};

export class Tournament {
    handle: supabaseClient;
    id?: string;
    settings?: TournamentSettings;
    matches?: Match[];

    constructor(handle: supabaseClient) {
        this.handle = handle;
    }

    /*
    Create a new event, this creates our event ONLY (tournament settings).
    */
    async createEvent(input: {
        name: string;
        teams: string[];
        pools: number;
        courts: number;
        date: string;
    }): Promise<Tournament | HttpError> {
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
                }
            ])
            .select();

        if (res.error) {
            throw error(400, res.error);
        }

        this.id = res.data.id;
        this.settings = res.data;
        return this;
    }

    /*
        Attempt to load our event (tournament settings) via SupaBase, we load matches and teams elsewhere.
    */
    async loadEvent(eventId?: string): Promise<Tournament | HttpError> {
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
        this.settings = res;

        return this;
    }

    async updateTournament(input: {
        id: string;
        name: string;
        teams: string[];
        pools: string;
        courts: string;
        date: string;
    }): Promise<Tournament | HttpError> {
        if (!input.teams || !input.pools || !input.courts) {
            throw error(400, `Tournament create call does not have all required values`);
        }

        const res: PostgrestSingleResponse<MemberType> = await this.handle
            .from('events')
            .update({
                name: input.name,
                teams: input.teams,
                pools: input.pools,
                courts: input.courts,
                date: input.date
            })
            .eq('id', input.id)
            .select();

        if (res.error) {
            throw error(400, res.error);
        }

        this.settings = input;

        return this;
    }

    async saveTournament() {
        throw new Error('Function not implemented.');
    }

    /*
    Load all matches for the current tournament.
    */
    async loadMatches(): Promise<Match[] | HttpError> {
        const res: PostgrestSingleResponse<MemberType> = await this.handle
            .from('matches')
            .select('*, matches_team1_fkey(name), matches_team2_fkey(name)')
            .eq('event_id', this.id)
            .eq('status', 'active');

        if (res.error) {
            throw error(400, res.error);
        }
        this.matches = res.data;
        return res.data;
    }

    /**
     * Insert new match.
     */
    async saveMatch() {
        throw new Error('Function not implemented.');
    }

    async createMatches() {
        self.matches = RoundRobin(self.teams);
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

/*
    Load all events for the provided owner Id.
    */
export async function loadEvents(
    handle: supabaseClient,
    ownerId: string
): Promise<Tournament[] | HttpError> {
    return await handle
        .from('events')
        .select('*')
        .eq('owner', ownerId)
        .then((res: PostgrestSingleResponse<MemberType>) => {
            if (res?.error) {
                throw error(res?.status, res?.error.details);
            }
            return res.data;
        });
}
