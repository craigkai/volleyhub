import { SupabaseDatabaseService } from '$lib/SupabaseDatabaseService';
import { error } from '$lib/toast';
import { Tournament } from '$lib/tournament';
import type { HttpError } from '@sveltejs/kit';

import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params, parent }) => {
	const data = await parent(['data']);

	const databaseService = new SupabaseDatabaseService(data?.supabase);
	let tournament = new Tournament(databaseService);

	if (params.slug != 'create') {
		await tournament
			.loadEvent(params.slug)
			.catch((err: HttpError) => {
				console.error(err)
				error(err?.body?.message);
			});
	}

	return { tournament, eventId: params.slug };
};
