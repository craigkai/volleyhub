import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// This is the implicit workflow not the PKCE workflow
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/protected-routes/dashboard';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
	}

	console.error('Error verifying code:', { code });
	redirect(303, '/auth/error');
};
