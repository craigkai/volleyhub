import { signUpSchema, signInSchema, resetPasswordSchema } from './schemas';
import { setError, superValidate, fail } from 'sveltekit-superforms';
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

		return { form, success: true };
	},

	signin: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(signInSchema));

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		console.log(error);

		if (error) {
			console.log(error);
			return setError(form, 'email', error.message);
		}

		return { signInForm: form, success: true };
	},

	resetPassword: async ({ request, locals: { supabase } }) => {
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

		return { form, success: true };
	}
};
