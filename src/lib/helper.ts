
import type { HttpError } from '@sveltejs/kit';
import { error } from '$lib/toast';
import { Event } from './event';
import { Matches } from './matches';
import { Teams } from './teams';

export async function loadInitialData(tournament: Event, matches: Matches, teams: Teams): Promise<any> {
    return await tournament
        .load()
        .catch((err: HttpError) => {
            error(err?.body?.message);
        })
        .then(async () => {
            return await matches
                .load()
                .catch((err: HttpError) => {
                    error(err?.body?.message);
                })
                .then(async () => {
                    return await teams.load().catch((err: HttpError) => {
                        error(err?.body?.message);
                    });
                });
        });
}
