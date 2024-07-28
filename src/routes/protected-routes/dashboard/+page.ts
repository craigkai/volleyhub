// src/routes/protected-routes/dashboard/+page.ts
import { EventSupabaseDatabaseService } from '$lib/database/event';
import { error } from '$lib/toast';
import type { HttpError } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { UserResponse } from '@supabase/supabase-js';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ parent }) => {
	const { supabase } = await parent();

	const userData = (await supabase.auth.getUser()?.catch((err: HttpError) => {
		error(err.body.message);
	})) as UserResponse | void;

	const user = userData?.data?.user;

	const eventsDatabaseService = new EventSupabaseDatabaseService(supabase);

	if (!user) {
		return { events: undefined };
	}

	const events = await eventsDatabaseService
		.loadEvents(user.id as string)
		.catch((err: HttpError) => {
			error(err.body.message);
		});

	return { events };
};
