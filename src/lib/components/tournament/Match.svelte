<script lang="ts">
	import { Tooltip, Label, Input } from 'flowbite-svelte';
	import { error, success } from '$lib/toast';
	import { CheckSolid, CloseSolid } from 'flowbite-svelte-icons';
	import { Matches } from '$lib/matches';

	export let match: MatchRow;
	export let matches: Matches;

	let editing: boolean = false;
	export let readOnly: boolean = false;

	async function updateMatch() {
		try {
			match = await matches.update(match);
			success(`Match ${match.matches_team1_fkey.name} vs ${match.matches_team2_fkey.name} updated`);
		} catch (err: any) {
			error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if !readOnly && editing}
	<div class="flex flex-row">
		<Label for="team1-score-input" class="block m-2">{match.matches_team1_fkey.name}:</Label>
		<Input
			id="team1-score-input"
			size="md"
			bind:value={match.team1_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
					editing = false;
				} else if (e?.key === 'ESC') {
					editing = false;
				}
			}}
		/>

		<Label for="team2-score-input" class="block m-2">{match.matches_team2_fkey.name}:</Label>
		<Input
			id="team2-score-input"
			size="sm"
			bind:value={match.team2_score}
			on:keydown={(e) => {
				if (e?.key === 'Enter') {
					updateMatch();
					editing = false;
				} else if (e?.key === 'ESC') {
					editing = false;
				}
			}}
		/>

		<CheckSolid
			color="green"
			class="m-2 cursor-pointer"
			on:click={() => {
				updateMatch();
				editing = false;
			}}
		/>
		<CloseSolid color="red" class="m-2 cursor-pointer" on:click={() => (editing = false)} />
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
			class:bg-green-300={match?.team1_score &&
				match?.team2_score &&
				match.team1_score > match.team2_score}
			class:bg-red-300={match?.team1_score &&
				match?.team2_score &&
				match.team2_score > match.team1_score}
		>
			{match?.matches_team1_fkey?.name}</span
		>
		vs
		<span
			class="p-1 rounded"
			class:bg-green-300={match?.team1_score &&
				match?.team2_score &&
				match?.team2_score > match?.team1_score}
			class:bg-red-300={match?.team1_score &&
				match?.team2_score &&
				match?.team1_score > match?.team2_score}>{match?.matches_team2_fkey?.name}</span
		>
	</div>
	{#if match?.team1_score && match?.team2_score}
		<Tooltip>{match?.team1_score} to {match?.team2_score}</Tooltip>
	{/if}
{/if}
