// src/routes/protected-routes/dashboard/+page.ts
import { SupabaseDatabaseService } from '$lib/supabaseDatabaseService';
import { error } from '$lib/toast';
import type { HttpError } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ parent }) => {
	const { supabase, session } = await parent();

	const databaseService = new SupabaseDatabaseService(supabase);

	const events = await databaseService
		.loadEvents(session?.user.id as string)
		.catch((err: HttpError) => {
			error(err.body.message);
		});

	return { events };
};
