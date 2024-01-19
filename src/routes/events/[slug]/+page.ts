import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params, url }) => {
	return { event_id: params.slug, default_team: url.searchParams.get('team') };
};
