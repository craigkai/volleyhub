// src/hooks.server.ts
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient({
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
		event
	});

	/**
	 * a little helper that is written for convenience so that instead
	 * of calling `const { data: { session } } = await supabase.auth.getSession()`
	 * you just call this `await getSession()`
	 */
	event.locals.getSession = async () => {
		let {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (dev) {
			const { data, error } = await event.locals.supabase.auth.signInWithPassword({
				email: import.meta.env.VITE_ADMIN_USER,
				password: import.meta.env.VITE_ADMIN_USER_PASSWORD
			});
			if (error) {
				throw error;
			}
			session = data.session;
		}

		return session;
	};

	if (event.url.pathname.startsWith('/protected-routes')) {
		const session = await event.locals.getSession();
		if (!session && !event.url.host.includes('localhost')) {
			// the user is not signed in
			throw redirect(303, '/auth');
		}
	}

	// protect POST requests to all routes that start with /protected-posts
	if (event.url.pathname.startsWith('/protected-posts') && event.request.method === 'POST') {
		const session = await event.locals.getSession();
		if (!session) {
			// the user is not signed in
			throw redirect(303, '/auth');
		}
	}

	// Make the login our homepage for now
	if (event.url.pathname === '/' && !event.url.host.includes('localhost')) {
		const session = await event.locals.getSession();
		if (!session) {
			// the user is not signed in
			throw redirect(303, '/auth');
		}
	}

	return resolve(event, {
		/**
		 * There´s an issue with `filterSerializedResponseHeaders` not working when using `sequence`
		 *
		 * https://github.com/sveltejs/kit/issues/8061
		 */
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
};
