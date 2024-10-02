import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();

	// only allow the signout subpath when visiting the auth path
	if (url.pathname !== '/auth/signout' && session) {
		redirect(303, '/');
	}
};
