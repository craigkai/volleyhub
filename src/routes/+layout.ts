// src/routes/+layout.ts
import type { LayoutLoad } from './$types';
import { createBrowserClient, isBrowser, parse } from '@supabase/ssr';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const load: LayoutLoad = async ({ depends, url, data }) => {
	depends('supabase:auth');

	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch
		},
		cookies: {
			get(key) {
				if (!isBrowser()) {
					return JSON.stringify(data.session);
				}

				const cookie = parse(document.cookie);
				return cookie[key];
			}
		}
	});

	const {
		data: { session }
	} = await supabase.auth.getSession();

	return { supabase, session, url: url.origin };
};
