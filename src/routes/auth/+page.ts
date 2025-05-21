// src/routes/auth/+page.ts
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	if (url.searchParams.get('type') === 'recovery') {
		redirect(303, '/auth/recovery');
	}

	if (url.searchParams.get('type') === 'magic') {
		redirect(303, '/auth/confirm');
	}

	return {};
};
