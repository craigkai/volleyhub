import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash') ?? url.searchParams.get('code'); // support both
	const type = (url.searchParams.get('type') ?? 'magiclink') as EmailOtpType;
	const next = url.searchParams.get('next') ?? '/protected-routes/dashboard';

	const redirectTo = new URL(url);
	redirectTo.pathname = next;
	redirectTo.searchParams.delete('token_hash');
	redirectTo.searchParams.delete('type');
	redirectTo.searchParams.delete('code');
	redirectTo.searchParams.delete('next');

	if (token_hash) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });

		if (!error) {
			redirect(303, redirectTo);
		}
	}

	console.error('Error verifying OTP:', { token_hash, type });
	redirectTo.pathname = '/auth/error';
	redirect(303, redirectTo);
};
