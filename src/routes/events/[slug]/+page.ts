import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params }) => {
	return { event_id: params.slug };
};
