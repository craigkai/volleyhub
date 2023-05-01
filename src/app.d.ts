import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface Locals {
		supabase: SupabaseClient<Database>;
		getSession(): Promise<Session | null>;
	}
	interface PageData {
		url: any;
		supabase: SupabaseClient<any, "public", any>;
		session: Session | null;
	}
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<Session | null>;

		}
		// interface PageData {}
		// interface Platform {}
	}
}

interface ImportMetaEnv {
	readonly VITE_SUPABASE_KEY: string
	readonly VITE_SUPABASE_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

export { };
