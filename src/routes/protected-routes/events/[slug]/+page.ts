import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params }) => {
	const event_uuid = params.slug;

	return { eventId: params.slug };
};
