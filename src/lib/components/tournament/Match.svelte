<script lang="ts">
	import type { Tournament } from '$lib/tournament';
	import { Tooltip, Label, Input } from 'flowbite-svelte';
	import { error, success } from '$lib/toast';

	export let match: MatchRow;
	export let tournament: Tournament;

	let editing: boolean = false;
	export let readOnly: boolean = false;

	async function updateMatch() {
		try {
			await tournament.updateMatch(match);
			success('Match updated');
		} catch (err: any) {
			error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	on:click={() => (editing = true)}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			editing = true;
		}
	}}
>
	{#if !readOnly && editing}
		<Label for="team1-score-input" class="block mb-2">{match.matches_team1_fkey.name} score:</Label>
		<Input
			id="team1-score-input"
			size="md"
			bind:value={match.team1_score}
			on:blur={() => (editing = false)}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
					editing = false;
				}
			}}
		/>

		<Label for="team2-score-input" class="block mb-2">{match.matches_team2_fkey.name} score:</Label>
		<Input
			id="team2-score-input"
			size="sm"
			bind:value={match.team2_score}
			on:blur={() => (editing = false)}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
					editing = false;
				}
			}}
		/>
	{:else}
		<div>
			<span
				class="p-2 rounded"
				class:bg-green-300={match?.team1_score > match?.team2_score}
				class:bg-red-300={match?.team2_score > match?.team1_score}
			>
				{match?.matches_team1_fkey?.name}</span
			>
			vs
			<span
				class="p-2 rounded"
				class:bg-green-300={match?.team2_score > match?.team1_score}
				class:bg-red-300={match?.team1_score > match?.team2_score}
				>{match?.matches_team2_fkey?.name}</span
			>
		</div>
		{#if match?.team1_score && match?.team2_score}
			<Tooltip>{match?.team1_score} to {match?.team2_score}</Tooltip>
		{/if}
	{/if}
</div>
