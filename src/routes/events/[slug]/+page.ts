import { initiateEvent } from '$lib/helper.svelte';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params, url, parent }) => {
	const { supabase } = await parent();

	let { tournament, matches, teams, bracket } = await initiateEvent(
		params.slug as unknown as number,
		supabase
	);

	return {
		event_id: params.slug,
		tournament,
		matches,
		teams,
		bracket,
		default_team: url.searchParams.get('team')
	};
};
