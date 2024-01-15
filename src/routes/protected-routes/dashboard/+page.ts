// src/routes/protected-routes/dashboard/+page.ts
import { SupabaseDatabaseService } from '$lib/SupabaseDatabaseService';
import { error } from '$lib/toast';
import type { HttpError } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ parent }) => {
	const data = await parent(['data']);

	const databaseService = new SupabaseDatabaseService(data?.supabase);
	const events = await databaseService
		.loadEvents(data.session?.user.id as string)
		.catch((err: HttpError) => {
			console.error(err);
			error(err.body.message);
		});

	return { events };
};
