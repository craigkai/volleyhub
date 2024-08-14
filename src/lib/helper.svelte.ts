import { pushState } from '$app/navigation';
import { error, type HttpError } from '@sveltejs/kit';
import toast from 'svelte-french-toast';
import { EventSupabaseDatabaseService } from '$lib/database/event';
import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Brackets } from '$lib/brackets/brackets.svelte';
import { Event as EventInstance } from '$lib/event.svelte';
import { Pool } from '$lib/pool/pool.svelte';
import { Teams as TeamsInstance } from '$lib/teams.svelte';
import type { Team } from './team.svelte';

export function showModal(matchId: number, type: string): void {
	pushState('', {
		showModal: true,
		matchId: matchId,
		type: type
	});
}

export function closeModal() {
	pushState('', {
		showModal: false
	});
}

export async function updateMatch(
	match: MatchRow | undefined,
	matches: Pool | Brackets,
	teams: TeamsInstance
): Promise<void> {
	if (match) {
		try {
			match.team1_score = Number(match.team1_score);
			match.team2_score = Number(match.team2_score);

			const updatedMatch = await matches.updateMatch(match);
			if (!updateMatch) {
				error(500, 'failed to update match');
			} else {
				const team1 = updatedMatch
					? teams.teams.find((t: Team) => t.id === updatedMatch.team1)
					: null;
				const team2 = updatedMatch
					? teams.teams.find((t: Team) => t.id === updatedMatch.team2)
					: null;

				toast.success(`Match ${team1?.name} vs ${team2?.name} updated`);
			}
		} catch (err) {
			toast.error((err as HttpError).toString());
		}
	}
}

export async function initiateEvent(
	eventId: number,
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

	try {
		await Promise.all([
			tournament.load(eventId),
			matches.load(eventId),
			teams.load(eventId),
			bracket.load(eventId)
		]);
	} catch (err) {
		console.error('Error loading event data:', err);
		throw new Error(
			(err as HttpError)?.body?.message || 'An error occurred while loading the event data.'
		);
	}

	return { tournament, matches, teams, bracket };
}
