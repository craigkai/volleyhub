import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const access_token = url.searchParams.get('access_token');
	const refresh_token = url.searchParams.get('refresh_token');
	const next = url.searchParams.get('next') ?? '/protected-routes/dashboard';

	if (code) {
		// OAuth login (e.g., Google)
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next);
		}
	}

	if (access_token && refresh_token) {
		// Magic link, email confirmation, or password recovery
		const { error } = await supabase.auth.setSession({
			access_token,
			refresh_token
		});
		if (!error) {
			throw redirect(303, next);
		}
	}

	console.error('Error verifying code or tokens:', { code, access_token, refresh_token });
	throw redirect(303, '/auth/error');
};
