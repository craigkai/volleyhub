import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { signUpSchema, signInSchema, magicLinkSchema } from './schemas';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	const { session } = await locals.safeGetSession();

	if (url.pathname !== '/auth/signout' && url.pathname !== '/auth/results' && session) {
		redirect(303, '/');
	}

	const signupForm = await superValidate(zod(signUpSchema));
	const signInForm = await superValidate(zod(signInSchema));
	const magicLinkForm = await superValidate(zod(magicLinkSchema));

	return { signupForm, signInForm, magicLinkForm };
};
