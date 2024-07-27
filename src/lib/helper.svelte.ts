import { Matches } from './matches.svelte';
import { pushState } from '$app/navigation';
import type { HttpError } from '@sveltejs/kit';
import { error, success } from '$lib/toast';

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

			const updatedMatch = await matches.updateMatch(match);
			success(
				`Match ${updatedMatch?.public_matches_team1_fkey.name} vs ${updatedMatch?.public_matches_team1_fkey.name} updated`
			);
		} catch (err) {
			error((err as HttpError).toString());
		}
	}
}
