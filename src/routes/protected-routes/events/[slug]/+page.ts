import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
import { error } from '$lib/toast';
import { Event } from '$lib/event';
import { Teams } from '$lib/teams';
import { Matches } from '$lib/matches';
import type { HttpError } from '@sveltejs/kit';

import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params, parent }) => {
	const { supabase } = await parent();

	const databaseService = new SupabaseDatabaseService(supabase);
	const tournament = new Event(Number(params.slug), databaseService);
	const matches = new Matches(Number(params.slug), databaseService);
	const teams = new Teams(Number(params.slug), databaseService);

	if (params.slug != 'create') {
		await tournament.load().catch((err: HttpError) => {
			error(err?.body?.message);
			return;
		});

		await matches.load().catch((err: HttpError) => {
			error(err?.body?.message);
			return;
		});

		await teams.load().catch((err: HttpError) => {
			error(err?.body?.message);
			return;
		});
	}

	return { teams, matches, tournament, event_id: params.slug };
};
