// src/routes/auth/+page.ts
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
	const type = url.searchParams.get('type');

	if (type === 'recovery' || type === 'magic' || type === 'verify') {
		return redirect(303, '/auth/confirm?type=' + type);
	}

	return {};
};
