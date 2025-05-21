import { signUpSchema, signInSchema, magicLinkSchema } from './schemas';
import { setError, message, superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signUpSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signUp({ email, password });

		if (error) {
			return setError(form, 'email', error.message);
		}

		return message(form, 'Confirmation email sent to your email!');
	},

	signin: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signInSchema));

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			fail(400, { form: setError(form, 'email', error.message) });
			return setError(form, 'email', error.message);
		}

		// Instead of returning the form directly, redirect or trigger a session update
		return { form, redirect: '/protected-routes/dashboard' };
	},

	resetpassword: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(magicLinkSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: '/auth/confirm'
		});

		if (error) {
			form.errors = error.message as any;
			return fail(400, { form });
		}

		return message(form, 'Password reset email sent');
	},

	magic: async ({ request, locals }) => {
		const form = await superValidate(request, zod(magicLinkSchema));
		if (!form.valid) return fail(400, { form });

		const { error } = await locals.supabase.auth.signInWithOtp({
			email: form.data.email,
			options: {
				emailRedirectTo: 'https://volleyhub.vercel.app/auth/confirm?next=/protected-routes/account'
			}
		});

		if (error) {
			return fail(400, {
				form,
				message: error.message
			});
		}

		return { form, success: true };
	}
};
