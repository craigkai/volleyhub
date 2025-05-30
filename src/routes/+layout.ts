import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { LayoutLoad } from './$types';
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { global: { fetch } })
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: { fetch },
				cookies: {
					getAll() {
						return data.cookies;
					}
				}
			});

	const sessionRes = await supabase.auth.getSession();
	const session = sessionRes.data.session;
	const is_admin = data.is_admin || false;
	const approved = data.approved || false;

	const {
		data: { user }
	} = await supabase.auth.getUser();

	return {
		user,
		session,
		supabase,
		is_admin,
		approved,
		isMobile: data.isMobile
	};
};
