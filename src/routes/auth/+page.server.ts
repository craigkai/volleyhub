import { redirect } from '@sveltejs/kit';
import { signUpSchema, signInSchema, magicLinkSchema } from './schemas';
import { setError, superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signUpSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signUp({ email, password });

		if (error) {
			setError(form, 'email', error.message);
			return fail(400, { form });
		}
		// Clear possible phantom session
		await supabase.auth.signOut();

		return redirect(303, '/auth/results?type=signup');
	},

	signin: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signInSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			setError(form, 'email', error.message);
			return fail(400, { form });
		}

		return redirect(303, '/protected-routes/dashboard');
	},

	resetpassword: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(magicLinkSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: 'https://volleyhub.vercel.app/auth/confirm?next=/protected-routes/account'
		});

		if (error) {
			return fail(400, { form: setError(form, 'email', error.message) });
		}
		// Clear possible phantom session
		await supabase.auth.signOut();

		return redirect(303, '/auth/results?type=reset');
	},

	magic: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(magicLinkSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: 'https://volleyhub.vercel.app/auth/confirm?next=/protected-routes/account'
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
