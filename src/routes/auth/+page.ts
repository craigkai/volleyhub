// src/routes/auth/+page.ts
import { EventSupabaseDatabaseService } from '$lib/database/event';
import type { PageLoad } from './$types';

// src/routes/events/+page.server.ts
export const load: PageLoad = async ({ parent, url }) => {
    const { supabase, session } = await parent();

    console.log(url);

    return {};
};
