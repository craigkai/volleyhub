<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import { Matches } from '$lib/matches.svelte';
	import { closeModal } from '$lib/helper.svelte';
	import type { Brackets } from '$lib/brackets.svelte';
	import { updateMatch } from '$lib/helper.svelte';

	let { matchId, matches = $bindable() }: { matchId: number; matches: Matches | Brackets } =
		$props();

	let match = matches?.matches?.find((m) => m.id === matchId);
</script>

{#if match}
	<div class="flex flex-col">
		<Label class="mb-2" for="team1-score-input"
			>Team `{match.public_matches_team1_fkey.name}`:</Label
		>
		<Input
			class=" border border-blue-500 rounded w-full py-2 px-3 mb-3 leading-tight"
			id="team1-score-input"
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

		<Label class="mb-2" for="team2-score-input"
			>Team `{match.public_matches_team2_fkey.name}`:</Label
		>
		<Input
			class="border border-blue-500 rounded w-full py-2 px-3 mb-3 leading-tight"
			id="team2-score-input"
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
