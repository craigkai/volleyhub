import { createServerClient } from '@supabase/ssr';
import { createHandler } from 'svelte-kit-bot-block';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { UAParser } from 'ua-parser-js';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { PUBLIC_COMMIT_REF, PUBLIC_ADMIN_USER, PUBLIC_ADMIN_USER_PASSWORD } from '$env/static/public';

export const supabase: Handle = async ({ event, resolve }) => {
	const userAgent = event.request.headers.get('user-agent') || '';
	const parser = new UAParser(userAgent);
	event.locals.isMobile = parser.getDevice().type === 'mobile';

	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				/**
				 * Note: You have to add the `path` variable to the
				 * set and remove method due to sveltekit's cookie API
				 * requiring this to be set, setting the path to an empty string
				 * will replicate previous/standard behavior (https://kit.svelte.dev/docs/types#public-types-cookies)
				 */
				cookiesToSet.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/' })
				);
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	if (import.meta.env.DEV) {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			const email = PUBLIC_ADMIN_USER;
			const password = PUBLIC_ADMIN_USER_PASSWORD;

			const { data, error } = await event.locals.supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				console.warn('Dev auto-login failed:', error.message);
			} else {
				console.info(`Auto-logged in as ${email}`);
			}
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	if (!event.locals.session && event.url.pathname.startsWith('/protected-routes')) {
		return redirect(303, '/auth');
	}

	if (event.locals.session && event.url.pathname === '/auth') {
		return redirect(303, '/protected-routes/dashboard');
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard, createHandler());
