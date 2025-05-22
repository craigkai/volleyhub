import { error, type HttpError } from '@sveltejs/kit';
import toast from 'svelte-5-french-toast';
import { EventSupabaseDatabaseService } from '$lib/database/event';
import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Brackets } from '$lib/brackets/brackets.svelte';
import { Event as EventInstance } from '$lib/event.svelte';
import { Pool } from '$lib/pool/pool.svelte';
import { Teams as TeamsInstance } from '$lib/teams.svelte';
import type { Match } from '$lib/match.svelte';

export async function updateMatch(match: Match): Promise<Match | undefined> {
	if (match) {
		try {
			match.team1_score = Number(match.team1_score);
			match.team2_score = Number(match.team2_score);

			const updatedMatch = await match.update(match);
			if (!updatedMatch) {
				error(500, 'failed to update match');
			}
			return updatedMatch;
		} catch (err) {
			toast.error((err as HttpError).toString());
		}
	}
}

export async function initiateEvent(
	eventId: number | 'create',
	supabase: supabaseClient
): Promise<{
	tournament: EventInstance;
	matches: Pool;
	teams: TeamsInstance;
	bracket: Brackets;
}> {
	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(supabase);
	const tournament = new EventInstance(eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(supabase);
	const matches = new Pool(matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(supabase);
	const teams = new TeamsInstance(teamsSupabaseDatabaseService);

	const bracket = new Brackets(matchesSupabaseDatabaseService);

	if (eventId === 'create') {
		return { tournament, matches, teams, bracket };
	}

	const loadWithFallback = async <T>(
		label: string,
		fn: () => Promise<T>
	): Promise<T | undefined> => {
		try {
			return await fn();
		} catch (err) {
			console.warn(`[initiateEvent] Failed to load ${label}:`, err);
			return undefined;
		}
	};

	await Promise.all([
		loadWithFallback('tournament', () => tournament.load(eventId)),
		loadWithFallback('matches', () => matches.load(eventId)),
		loadWithFallback('teams', () => teams.load(eventId)),
		loadWithFallback('bracket', () => bracket.load(eventId))
	]);

	return { tournament, matches, teams, bracket };
}
