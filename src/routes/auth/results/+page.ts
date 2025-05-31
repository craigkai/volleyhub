// src/routes/auth/confirm/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, parent }) => {
	const type = url.searchParams.get('type');
	let next = url.searchParams.get('next');

	if (!next || next.trim() === '') {
		next = '/protected-routes/dashboard';
	}

const { supabase } = await parent();

	return {
		type,
		next,
supabase
	};
};
