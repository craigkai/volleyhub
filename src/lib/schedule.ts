import TournamentOrganizer from 'tournament-organizer';
import type { Tournament } from 'tournament-organizer/dist/Tournament';
import { error, type HttpError } from '@sveltejs/kit';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export async function saveTournament() {
    throw new Error('Function not implemented.');
}

/*
Create our Tournament object
*/
export async function createTournament(input: any): Promise<Tournament> {
    if (!input.teams || !input.pools || !input.courts) {
        throw error(400, `Tournament create call does not have all required values`);
    }

    const manager = new TournamentOrganizer();
    const tournament: Tournament = manager.createTournament(input?.name, {
        status: 'setup'
    });

    for (var i = 0; i < input.teams.length; i++) {
        tournament.createPlayer(input.teams[i]);
    }

    if (tournament?.stageOne) {
        tournament.stageOne.format = 'round-robin';
    }
    if (tournament?.stageTwo) {
        tournament.stageTwo.format = 'single-elimination';
    }
    return tournament;
}

/*
Attempt to load our tournament via SupaBase.
*/
export async function loadTournament(client: supabaseClient, eventId?: string, eventName?: string): Promise<Tournament | HttpError> {
    if (!eventId && !eventName) {
        throw error(400, 'Invalid event ID/Name, are you sure your link is correct?');
    }

    return client
        .from('events')
        .select('*')
        .or(`id.eq.${eventId},name.eq.${eventName}`)
        .single()
        .then((res: PostgrestSingleResponse<any>) => {
            if (res?.error) {
                throw error(res?.status, res?.error.details)
            }
            return createTournament(res?.data)
        });
}
