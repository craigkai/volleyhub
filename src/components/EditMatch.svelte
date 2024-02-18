<script lang="ts">
	import { Label, Input } from 'flowbite-svelte';
	import type { HttpError } from '@sveltejs/kit';
	import { error, success } from '$lib/toast';
	import { Matches } from '$lib/matches';
	import { pushState } from '$app/navigation';
	import type { Brackets } from '$lib/brackets';

	export let matchId: number;
	export let matches: Matches | Brackets;

	let match = $matches?.matches?.find((m) => m.id === matchId);

	async function updateMatch() {
		if (match) {
			try {
				// Need to convert string inputs to numbers
				match.team1_score = Number(match.team1_score);
				match.team2_score = Number(match.team2_score);

				match = await matches.put(match);
				success(
					`Match ${match.matches_team1_fkey.name} vs ${match.matches_team2_fkey.name} updated`
				);
			} catch (err) {
				error((err as HttpError).toString());
			}
		}
	}

	function closeModal() {
		pushState('', {
			showModal: false
		});
	}
</script>

{#if match}
	<div class="flex flex-col">
		<Label for="team1-score-input">Team `{match.matches_team1_fkey.name}`:</Label>
		<Input
			id="team1-score-input"
			size="md"
			type="number"
			bind:value={match.team1_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
				} else if (e?.key === 'Escape') {
					closeModal();
				}
			}}
		/>

		<Label for="team2-score-input">Team `{match.matches_team2_fkey.name}`:</Label>
		<Input
			id="team2-score-input"
			size="sm"
			type="number"
			bind:value={match.team2_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
				} else if (e?.key === 'Escape') {
					closeModal();
				}
			}}
		/>
	</div>
{/if}
