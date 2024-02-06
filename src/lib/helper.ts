import type { HttpError } from '@sveltejs/kit';
import { error } from '$lib/toast';
import { Event } from './event';
import { Matches } from './matches';
import { Teams } from './teams';

export async function loadInitialData(event: Event, matches: Matches, teams: Teams): Promise<any> {
	if ((event.id as unknown as string) !== 'create') {
		return await event
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
}
