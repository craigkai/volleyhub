import { Event } from './event';
import { Matches } from './matches';
import { Teams } from './teams';
import { pushState } from '$app/navigation';
import type { HttpError } from '@sveltejs/kit';
import { error, success } from '$lib/toast';

export async function loadInitialData(event: Event, matches: Matches, teams: Teams): Promise<any> {
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
