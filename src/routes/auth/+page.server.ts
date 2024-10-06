import { signUpSchema, signInSchema, resetPasswordSchema } from './schemas';
import { setError, message, superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signUpSchema));
		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signUp({ email, password });

		if (error) {
			form.errors = error.message as any;
			return fail(400, { form });
		}

		return message(form, 'Confirmation email sent to your email!');
	},

	signin: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signInSchema));

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			console.log(error);
			return setError(form, 'email', error.message);
		}

		// Instead of returning the form directly, redirect or trigger a session update
		// Option 1: Redirect after signing in
		return { success: true, redirect: '/protected-routes/dashboard' };

		// Option 2: You could set a session variable or state that the UI listens to
	},

	resetpassword: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(resetPasswordSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: '/auth/recovery'
		});

		if (error) {
			form.errors = error.message as any;
			return fail(400, { form });
		}

		return message(form, 'Password reset email sent');
	}
};
