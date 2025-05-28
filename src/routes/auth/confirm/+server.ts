// src/routes/auth/confirm/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const access_token = url.searchParams.get('access_token');
	const refresh_token = url.searchParams.get('refresh_token');
	const next = url.searchParams.get('next') ?? '/protected-routes/dashboard';

	// 1. OAuth Flow
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return redirect(303, `/auth/results?type=oauth&next=${encodeURIComponent(next)}`);
		}
	}

	// 2. Magic Link / Password Reset Flow
	if (access_token && refresh_token) {
		const { error } = await supabase.auth.setSession({ access_token, refresh_token });

		if (!error) {
			// Check if the user is now verified
			const {
				data: { user }
			} = await supabase.auth.getUser();
			const isVerified = !!user?.email_confirmed_at;

			const resultType = isVerified ? 'magic' : 'verify';

			return redirect(303, `/auth/results?type=${resultType}&next=${encodeURIComponent(next)}`);
		}
	}

	// 3. If nothing works
	console.error('Error verifying code or tokens:', {
		code,
		access_token,
		refresh_token
	});

	return redirect(303, '/auth/results?type=error');
};
