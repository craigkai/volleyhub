import { SupabaseDatabaseService } from '$lib/SupabaseDatabaseService';
import { error } from '$lib/toast';
import type { HttpError } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { Event } from '$lib/event';
import { Teams } from '$lib/teams';
import { Matches } from '$lib/matches';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params, parent }) => {
	const data = await parent(['data']);

	const databaseService = new SupabaseDatabaseService(data?.supabase);
	const tournament = new Event(params.slug, databaseService);
	const matches = new Matches(params.slug, databaseService);
	const teams = new Teams(params.slug, databaseService);

	await tournament.load().catch((err: HttpError) => {
		console.error(err);
		error(err?.body?.message);
	});

	await matches.load().catch((err: HttpError) => {
		console.error(err);
		error(err?.body?.message);
	});

	await teams.load().catch((err: HttpError) => {
		console.error(err);
		error(err?.body?.message);
	});

	return { teams, matches, tournament, eventId: params.slug };
};
