import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';
import type { Database } from '../../types/supabase';
import { z } from 'zod';
import type { eventsRowSchema, matchesRowSchema, teamsRowSchema } from './types/schemas';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	type TeamRow = z.infer<typeof teamsRowSchema>;
	type EventRow = z.infer<typeof eventsRowSchema>;
	type MatchRow = z.infer<typeof matchesRowSchema> & {
		matches_team1_fkey: { name: string };
		matches_team2_fkey: { name: string };
	};

	interface Match {
		round: number;
		match: number;
		player1: string | number | null;
		player2: string | number | null;
		win?: {
			round: number;
			match: number;
		};
		loss?: {
			round: number;
			match: number;
		};
	}

	type UserMatch = Partial<Match> & {
		court: number;
		round: number;
		event_id: number;
		team1: number;
		team2: number;
	};

	interface Locals {
		supabase: SupabaseClient<Database>;
		getSession(): Promise<Session | null>;
	}
	interface PageData {
		eventName?: string;
		eventId?: string;
		supabase: SupabaseClient<Database>;
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

export {};
