// src/routes/protected-routes/dashboard/+page.ts
import { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
import { error } from '$lib/toast';
import type { HttpError } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ parent }) => {
	const { supabase, user } = await parent();

	const eventsDatabaseService = new EventSupabaseDatabaseService(supabase);

	const events = await eventsDatabaseService
		.loadEvents(user?.id as string)
		.catch((err: HttpError) => {
			error(err.body.message);
		});

	return { events };
};
