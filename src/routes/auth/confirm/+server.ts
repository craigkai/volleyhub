// src/routes/auth/confirm/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const access_token = url.searchParams.get('access_token');
	const refresh_token = url.searchParams.get('refresh_token');
	const next = url.searchParams.get('next') ?? '/protected-routes/dashboard';

	// Handle OAuth (e.g., Google)
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, `/auth/results?type=oauth&next=${encodeURIComponent(next)}`);
		}
	}

	// Handle Magic Link / Password Reset
	if (access_token && refresh_token) {
		const { error } = await supabase.auth.setSession({
			access_token,
			refresh_token
		});
		if (!error) {
			throw redirect(303, `/auth/results?type=magic&next=${encodeURIComponent(next)}`);
		}
	}

	// If no tokens present or both flows fail, redirect with error
	console.error('Error verifying code or tokens:', {
		code,
		access_token,
		refresh_token
	});

	throw redirect(303, '/auth/results?type=error');
};
