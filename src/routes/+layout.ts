// src/routes/+layout.ts
import { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit';
import type { LayoutLoad } from './$types';
import type { Database } from '../types/supabase';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || '';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
	depends('supabase:auth');

	const supabase = createSupabaseLoadClient<Database>({
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
		event: { fetch },
		serverSession: data.session
	});

	const {
		data: { session }
	} = await supabase.auth.getSession();

	return { supabase, session, deploymentGitBranch: data.deploymentGitBranch };
};
