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
    settings: TournamentSettings;
    matches?: Match[];

    constructor(handle: supabaseClient) {
        this.handle = handle;
        this.settings = {};
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
            .insert({
                owner: ownerId,
                name: input.name,
                pools: input.pools,
                courts: input.courts,
                date: input.date
            })
            .select()
            .single();

        if (res.error) {
            console.error('Failed to cerate new event');
            throw error(400, res.error);
        }

        this.id = res.data.id;
        this.settings = res.data;

        if (this.id && this.settings) {
            const teamsIds: string[] = [];
            input.teams.forEach(async (team: string) => {
                await this.createTeam(team, this.id as string).then((id) =>
                    teamsIds.push(id as string)
                );
            });

            this.settings.teams = teamsIds;
        }

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

        const teamsRes: PostgrestSingleResponse<MemberType> = await this.handle
            .from('teams')
            .select()
            .eq('event_id', eventId);

        if (teamsRes.error) {
            console.error('Failed to get teams for event');
            throw error(400, teamsRes.error);
        }

        this.settings.teams = teamsRes.data;

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
            throw error(400, `Tournament update call does not have all required values`);
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
        // Call multi insert:
        // const { data, error } = await supabase
        // .from('teams')
        // .insert([
        // { some_column: 'someValue' },
        // { some_column: 'otherValue' },
        // ])
        // .select()
    }

    /*
    Either adding updating match metadata such as teams in the match or adding results.
    */
    async updateMatch() {
        throw new Error('Function not implemented.');
    }

    /*
    Inserts new team into supabase, if a team exists where team name and event id match what we
    are trying to create, then return that team Id.
    */
    async createTeam(name: string, eventId: string): Promise<string | HttpError> {
        const res: PostgrestSingleResponse<MemberType> = await this.handle
            .from('teams')
            .upsert({ name: name, event_id: eventId })
            .select();

        if (res.error) {
            console.error('Failed to create new team');
            throw error(400, res.error);
        }
        return res.data.id;
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
                throw error(res?.status, res?.error);
            }
            return res.data;
        });
}
