<script lang="ts">
	import { Label, Input } from 'flowbite-svelte';
	import { Matches } from '$lib/matches.svelte';
	import { closeModal } from '$lib/helper.svelte';
	import type { Brackets } from '$lib/brackets.svelte';
	import { updateMatch } from '$lib/helper.svelte';

	export let matchId: number;
	export let matches: Matches | Brackets;

	let match = matches?.matches?.find((m) => m.id === matchId);
</script>

{#if match}
	<div class="flex flex-col">
		<Label for="team1-score-input">Team `{match.public_matches_team1_fkey.name}`:</Label>
		<Input
			id="team1-score-input"
			size="md"
			type="number"
			bind:value={match.team1_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch(match, matches);
				} else if (e?.key === 'Escape') {
					closeModal();
				}
			}}
		/>

		<Label for="team2-score-input">Team `{match.public_matches_team2_fkey.name}`:</Label>
		<Input
			id="team2-score-input"
			size="sm"
			type="number"
			bind:value={match.team2_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch(match, matches);
				} else if (e?.key === 'Escape') {
					closeModal();
				}
			}}
		/>
	</div>
{/if}
