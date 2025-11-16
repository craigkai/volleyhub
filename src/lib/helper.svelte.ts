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
	if (!match) {
		return undefined;
	}

	// Check if we're online before attempting save
	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		toast.error('Cannot save while offline. Please check your connection.');
		return undefined;
	}

	try {
		match.team1_score = Number(match.team1_score);
		match.team2_score = Number(match.team2_score);

		const updatedMatch = await match.update(match);
		if (!updatedMatch) {
			toast.error('Failed to save match. Please try again.');
			console.error('Match update returned null', {
				matchId: match.id,
				team1_score: match.team1_score,
				team2_score: match.team2_score
			});
			return undefined;
		}
		return updatedMatch;
	} catch (err) {
		const errorMsg = (err as HttpError)?.message || (err as Error)?.message || String(err);

		// Provide more specific error messages
		if (errorMsg.toLowerCase().includes('session expired')) {
			toast.error('Your session expired. Please refresh the page.');
		} else if (
			errorMsg.toLowerCase().includes('network') ||
			errorMsg.toLowerCase().includes('fetch')
		) {
			toast.error('Network error. Check your connection and try again.');
		} else if (errorMsg.toLowerCase().includes('timeout')) {
			toast.error('Request timed out. Please try again.');
		} else {
			toast.error(`Failed to save: ${errorMsg}`);
		}

		console.error('Match update error:', {
			matchId: match.id,
			error: errorMsg,
			fullError: err
		});
		return undefined;
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
