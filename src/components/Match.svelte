<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { showModal } from '$lib/helper';

	export let match: MatchRow;
	export let readOnly: boolean = false;

	export let showWinLoss: boolean = true;

	const winClass = 'bg-green-300 dark:bg-green-700';
	const lossClass = 'bg-red-300 dark:bg-red-700';
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="flex justify-center place-items-center"
	on:click={() => {
		if (!readOnly && !$page.state.showModal) {
			showModal(match.id, 'pool');
		}
	}}
>
	<span
		class="p-1 rounded {showWinLoss &&
		match?.team1_score &&
		match?.team2_score &&
		match.team1_score > match.team2_score
			? winClass
			: ''} {showWinLoss &&
		match?.team1_score &&
		match?.team2_score &&
		match.team2_score > match.team1_score
			? lossClass
			: ''}"
	>
		{match?.matches_team1_fkey?.name}</span
	>
	vs
	<span
		class="p-1 rounded {showWinLoss &&
		match?.team1_score &&
		match?.team2_score &&
		match.team2_score > match.team1_score
			? winClass
			: ''} {showWinLoss &&
		match?.team1_score &&
		match?.team2_score &&
		match?.team1_score > match?.team2_score
			? lossClass
			: ''}">{match?.matches_team2_fkey?.name}</span
	>
</div>
{#if match?.team1_score && match?.team2_score}
	<Tooltip>{match?.team1_score} to {match?.team2_score}</Tooltip>
{/if}
