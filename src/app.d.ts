import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';
import type { Database } from '../../types/supabase';

type memberType = Database['public']['Tables']['teams']['Row'];

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface Locals {
		supabase: SupabaseClient<Database>;
		getSession(): Promise<Session | null>;
	}
	interface PageData {
		eventName?: string;
		eventId?: string;
		url: any;
		supabase: SupabaseClient<any, 'public', any>;
		session: Session | null;
	}
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<Session | null>;
		}
		// interface Platform {}
	}
	type supabaseClient = SupabaseClient<Database>;
}

interface ImportMetaEnv {
	readonly VITE_SUPABASE_KEY: string;
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_COMMIT_REF: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export { };
