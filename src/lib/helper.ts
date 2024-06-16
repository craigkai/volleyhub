import { Event } from './event';
import { Matches } from './matches';
import { Teams } from './teams';
import { pushState } from '$app/navigation';
import type { HttpError } from '@sveltejs/kit';
import { error, success } from '$lib/toast';
import { EventSupabaseDatabaseService } from '$lib/database/event';
import { MatchesSupabaseDatabaseService } from '$lib/database/matches';
import { TeamsSupabaseDatabaseService } from '$lib/database/teams';
import { Brackets } from '$lib/brackets';
import { Event as EventInstance } from '$lib/event';
import { Matches as MatchesInstance } from '$lib/matches';
import { Teams as TeamsInstance } from '$lib/teams';

export async function loadInitialData(
	event: Event,
	matches: Matches,
	teams: Teams,
	bracket: Brackets
): Promise<void> {
	if ((event.id as unknown as string) !== 'create') {
		try {
			await event.load();
			await matches.load();
			await teams.load();
			await bracket.load();
		} catch (err) {
			error((err as HttpError)?.body?.message);
		}
	}
}

export function showModal(matchId: number, type: string): void {
	pushState('', {
		showModal: true,
		matchId: matchId,
		type: type
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

export function initiateEvent(
	eventId: number,
	supabase: supabaseClient
): {
	tournament: EventInstance;
	matches: MatchesInstance;
	teams: TeamsInstance;
	bracket: Brackets;
} {
	const eventSupabaseDatabaseService = new EventSupabaseDatabaseService(supabase);
	const tournament = new EventInstance(eventId, eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(supabase);
	const matches = new MatchesInstance(eventId, matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(supabase);
	const teams = new TeamsInstance(eventId, teamsSupabaseDatabaseService);

	const bracket = new Brackets(eventId, matchesSupabaseDatabaseService);

	return { tournament, matches, teams, bracket };
}
