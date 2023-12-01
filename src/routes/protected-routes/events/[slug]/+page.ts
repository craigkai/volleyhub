import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ params }) => {
	return { eventId: params.slug };
};
