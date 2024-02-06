<script lang="ts">
	import { Tooltip, Label, Input } from 'flowbite-svelte';
	import { error, success } from '$lib/toast';
	import { Matches } from '$lib/matches';
	import type { HttpError } from '@sveltejs/kit';

	export let match: MatchRow;
	export let matches: Matches;

	export let showWinLoss: boolean = true;

	let editing: boolean = false;
	export let readOnly: boolean = false;

	async function updateMatch() {
		try {
			// Need to convert string inputs to numbers
			match.team1_score = Number(match.team1_score);
			match.team2_score = Number(match.team2_score);

			match = await matches.put(match);
			success(`Match ${match.matches_team1_fkey.name} vs ${match.matches_team2_fkey.name} updated`);
		} catch (err) {
			error((err as HttpError).toString());
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if !readOnly && editing}
	<div class="flex flex-col">
		<Label for="team1-score-input">{match.matches_team1_fkey.name}:</Label>
		<Input
			id="team1-score-input"
			size="md"
			type="number"
			bind:value={match.team1_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
					editing = false;
				} else if (e?.key === 'Escape') {
					editing = false;
				}
			}}
		/>

		<Label for="team2-score-input">{match.matches_team2_fkey.name}:</Label>
		<Input
			id="team2-score-input"
			size="sm"
			type="number"
			bind:value={match.team2_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
					editing = false;
				} else if (e?.key === 'Escape') {
					editing = false;
				}
			}}
		/>
	</div>
{:else}
	<div
		class="flex justify-center place-items-center"
		on:click={() => {
			if (!editing) {
				editing = true;
			}
		}}
	>
		<span
			class="p-1 rounded"
			class:bg-green-300={showWinLoss &&
				match?.team1_score &&
				match?.team2_score &&
				match.team1_score > match.team2_score}
			class:bg-red-300={showWinLoss &&
				match?.team1_score &&
				match?.team2_score &&
				match.team2_score > match.team1_score}
		>
			{match?.matches_team1_fkey?.name}</span
		>
		vs
		<span
			class="p-1 rounded"
			class:bg-green-300={showWinLoss &&
				match?.team1_score &&
				match?.team2_score &&
				match?.team2_score > match?.team1_score}
			class:bg-red-300={showWinLoss &&
				match?.team1_score &&
				match?.team2_score &&
				match?.team1_score > match?.team2_score}>{match?.matches_team2_fkey?.name}</span
		>
	</div>
	{#if match?.team1_score && match?.team2_score}
		<Tooltip>{match?.team1_score} to {match?.team2_score}</Tooltip>
	{/if}
{/if}
