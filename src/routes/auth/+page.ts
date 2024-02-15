// src/routes/auth/+page.ts
import { EventSupabaseDatabaseService } from '$lib/database/event';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ parent, url }) => {
    const { supabase, session } = await parent();

    console.log(url);
    if (url.searchParams.get('type') === 'recovery') {
        redirect(303, '/auth/recovery');
    }

    return {};
};
