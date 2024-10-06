import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { signUpSchema, signInSchema, resetPasswordSchema } from './schemas';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();

	// only allow the signout subpath when visiting the auth path
	if (url.pathname !== '/auth/signout' && session) {
		redirect(303, '/');
	}

	const signupForm = await superValidate(zod(signUpSchema));
	const signInForm = await superValidate(zod(signInSchema));
	const resetPasswordForm = await superValidate(zod(resetPasswordSchema));

	// Return them both
	return { signupForm, signInForm, resetPasswordForm };
};
