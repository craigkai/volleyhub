<script lang="ts">
	import type { Tournament } from '$lib/tournament';
	import { type HttpError } from '@sveltejs/kit';
	import { TableBodyCell, Tooltip } from 'flowbite-svelte';
	import { error, success } from '$lib/toast';

	export let match: MatchRow;
	export let tournament: Tournament;

	let editing: boolean = false;

	async function updateMatch() {
		tournament
			?.updateMatch(match)
			.then(() => success('Match updated'))
			.catch((err: HttpError) => error(err?.body?.message));
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:click={() => (editing = true)}>
	{#if editing}
		<TableBodyCell>{match.matches_team1_fkey.name} vs {match.matches_team2_fkey.name}</TableBodyCell
		>
		<TableBodyCell>
			<input
				type="text"
				bind:value={match.team1_score}
				on:blur={() => (editing = false)}
				on:keydown={(e) => {
					if (e?.key === 'Enter') {
						updateMatch();
						editing = false;
					}
				}}
			/>
		</TableBodyCell>
		<TableBodyCell>
			<input
				type="text"
				bind:value={match.team2_score}
				on:blur={() => (editing = false)}
				on:keydown={(e) => {
					if (e?.key === 'Enter') {
						updateMatch();
						editing = false;
					}
				}}
			/>
		</TableBodyCell>
	{:else}
		<TableBodyCell>
			<span
				class="p-2 rounded"
				class:bg-green-300={match?.team1_score > match?.team2_score}
				class:bg-red-300={match?.team2_score > match?.team1_score}
			>
				{match.matches_team1_fkey.name}</span
			>
			vs
			<span
				class="p-2 rounded"
				class:bg-green-300={match?.team2_score > match?.team1_score}
				class:bg-red-300={match?.team1_score > match?.team2_score}
				>{match.matches_team2_fkey.name}</span
			></TableBodyCell
		>
		{#if match?.team1_score && match?.team2_score}
			<Tooltip>{match?.team1_score} to {match?.team2_score}</Tooltip>
		{/if}
	{/if}
</div>
