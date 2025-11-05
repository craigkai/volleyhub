import { redirect } from '@sveltejs/kit';
import { signInSchema, magicLinkSchema } from './schemas';
import { setError, superValidate, fail } from 'sveltekit-superforms';
import { z } from 'zod';

// Simple signup schema without password confirmation
const simpleSignUpSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8)
});
import { zod4 } from 'sveltekit-superforms/adapters';

export const actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod4(simpleSignUpSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { data, error } = await supabase.auth.signUp({ email, password });

		if (error) {
			setError(form, 'email', error.message);
			return fail(400, { form });
		}

		if (data.session) {
			// Session is valid — redirect to dashboard or protected area
			return redirect(303, '/protected-routes/dashboard');
		} else {
			// No session — likely needs to confirm email first
			return redirect(303, '/auth/results?type=signup');
		}

		return redirect(303, '/auth/results?type=signup');
	},

	signin: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod4(signInSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			setError(form, 'email', error.message);
			return fail(400, { form });
		}

		return redirect(303, '/protected-routes/dashboard');
	},

	resetpassword: async ({ request, locals: { supabase }, url }) => {
		const form = await superValidate(request, zod4(magicLinkSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		// Use the current origin from the request to support multiple environments
		const origin = url.origin;
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${origin}/auth/confirm?next=/protected-routes/account`
		});

		if (error) {
			return fail(400, { form: setError(form, 'email', error.message) });
		}
		// Clear possible phantom session
		await supabase.auth.signOut();

		return redirect(303, '/auth/results?type=reset');
	},

	magic: async ({ request, locals: { supabase }, url }) => {
		const form = await superValidate(request, zod4(magicLinkSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		// Use the current origin from the request to support multiple environments
		const origin = url.origin;
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${origin}/auth/confirm?next=/protected-routes/account`
			}
		});

		if (error) {
			return fail(400, { form: setError(form, 'email', error.message) });
		}
		// Clear possible phantom session
		await supabase.auth.signOut();

		return redirect(303, '/auth/results?type=magic');
	}
};
