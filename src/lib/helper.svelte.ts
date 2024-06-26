import { Matches } from './matches.svelte';
import { pushState } from '$app/navigation';
import type { HttpError } from '@sveltejs/kit';
import { error, success } from '$lib/toast';
import { EventSupabaseDatabaseService } from '$lib/database/event.svelte';
import { MatchesSupabaseDatabaseService } from '$lib/database/matches.svelte';
import { TeamsSupabaseDatabaseService } from '$lib/database/teams.svelte';
import { Brackets } from '$lib/brackets.svelte';
import { Event as EventInstance } from '$lib/event.svelte';
import { Matches as MatchesInstance } from '$lib/matches.svelte';
import { Teams as TeamsInstance } from '$lib/teams.svelte';

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

export async function updateMatch(match: MatchRow | undefined, matches: Matches): Promise<void> {
	if (match) {
		try {
			match.team1_score = Number(match.team1_score);
			match.team2_score = Number(match.team2_score);

			if (match.team1_score !== undefined && match.team2_score !== undefined) {
				const updatedMatch = await matches.put(match);
				success(
					`Match ${updatedMatch?.public_matches_team1_fkey.name} vs ${updatedMatch?.public_matches_team1_fkey.name} updated`
				);
			}
		} catch (err) {
			error((err as HttpError).toString());
		}
	}
}

export async function initiateEvent(
	eventId: number,
	supabase: supabaseClient
): Promise<{
	tournament: EventInstance;
	matches: MatchesInstance;
	teams: TeamsInstance;
	bracket: Brackets;
}> {
	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(supabase);
	const tournament = $state(new EventInstance(eventId, eventSupabaseDatabaseService));

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(supabase);
	const matches = $state(new MatchesInstance(eventId, matchesSupabaseDatabaseService));

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(supabase);
	const teams = $state(new TeamsInstance(eventId, teamsSupabaseDatabaseService));

	const bracket = $state(new Brackets(eventId, matchesSupabaseDatabaseService));

	if ((eventId as unknown as string) !== 'create') {
		try {
			await tournament.load();
			await matches.load();
			await teams.load();
			await bracket.load();
		} catch (err) {
			error((err as HttpError)?.body?.message);
		}
	}

	return { tournament, matches, teams, bracket };
}
