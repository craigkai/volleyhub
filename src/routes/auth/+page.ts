// src/routes/auth/+page.ts
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ url }) => {
	if (url.searchParams.get('type') === 'recovery') {
		redirect(303, '/auth/recovery');
	}
	return {};
};
