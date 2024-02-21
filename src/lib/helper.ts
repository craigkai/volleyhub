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
): Promise<any> {
	if ((event.id as unknown as string) !== 'create') {
		return await event
			.load()
			.catch((err: HttpError) => {
				error(err?.body?.message);
			})
			.then(async () => {
				return await matches
					.load()
					.catch((err: HttpError) => {
						error(err?.body?.message);
					})
					.then(async () => {
						return await teams.load().catch((err: HttpError) => {
							error(err?.body?.message);
						});
					})
					.then(async () => {
						return await bracket.load().catch((err: HttpError) => {
							error(err?.body?.message);
						});
					});
			});
	}
}

export function showModal(matchId: number, type: string) {
	pushState('', {
		showModal: true,
		matchId: matchId,
		type: type
	});
}

export async function updateMatch(match: MatchRow | undefined, matches: Matches) {
	if (match) {
		try {
			// Need to convert string inputs to numbers
			match.team1_score = Number(match.team1_score);
			match.team2_score = Number(match.team2_score);

			if (match.team1_score && match.team2_score) {
				match = await matches.put(match);
				success(
					`Match ${match.matches_team1_fkey.name} vs ${match.matches_team2_fkey.name} updated`
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
	let tournament = new EventInstance(eventId, eventSupabaseDatabaseService);

	const matchesSupabaseDatabaseService = new MatchesSupabaseDatabaseService(supabase);
	let matches = new MatchesInstance(eventId, matchesSupabaseDatabaseService);

	const teamsSupabaseDatabaseService = new TeamsSupabaseDatabaseService(supabase);
	let teams = new TeamsInstance(eventId, teamsSupabaseDatabaseService);

	let bracket = new Brackets(eventId, matchesSupabaseDatabaseService);

	return { tournament, matches, teams, bracket };
}
