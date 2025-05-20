import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
	depends('supabase:auth');

	let supabase;

	if (typeof window !== 'undefined') {
		const { createBrowserClient } = await import('@supabase/ssr');
		supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { fetch }
		});
	} else {
		const { createServerClient } = await import('@supabase/ssr');
		supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { fetch },
			cookies: {
				getAll() {
					return data.cookies;
				}
			}
		});
	}

	const sessionRes = await supabase.auth.getSession();
	const session = sessionRes.data.session;

	const {
		data: { user }
	} = await supabase.auth.getUser();

	return { session, supabase, user, isMobile: data.isMobile };
};
