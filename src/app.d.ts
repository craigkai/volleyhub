import { SupabaseClient, Session } from '@supabase/supabase-js';
import { Database } from './DatabaseDefinitions';
import type { Database } from '../../types/supabase';
import { z } from 'zod';
import type {
	eventsRowSchema,
	matchesRowSchema,
	teamsRowSchema,
	matchStateSchema
} from '$schemas/supabase';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	type TeamRow = z.infer<typeof teamsRowSchema>;
	type EventRow = z.infer<typeof eventsRowSchema>;
	type MatchRow = z.infer<typeof matchesRowSchema>;

	type MatchState = z.infer<typeof matchStateSchema>;

	type Round = {
		value: number;
		matches: MatchRow[];
	};

	interface TeamScores {
		[teamName: string]: {
			wins: number;
			pointsDiff: number;
			headToHeadWins: Record<string, number>;
			totalPoints: number;
		};
	}

	type UserMatch = Partial<MatchRow> & {
		court: number;
		round: number;
		event_id: number;
		team1: number;
		team2: number;
		child_id?: number;
	};

	namespace App {
		interface Supabase {
			Database: import('./DatabaseDefinitions').Database;
			SchemaName: 'public';
		}

		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			isMobile: boolean;
			is_admin: boolean;
			approved: boolean;
		}
		interface PageData {
			session: Session | null;
		}
		interface PageState {
			matchId?: number;
			type?: string;
			showModal?: boolean;
			eventCreated?: number;
		}
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
