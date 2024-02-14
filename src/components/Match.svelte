<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { pushState } from '$app/navigation';

	export let match: MatchRow;
	export let readOnly: boolean = false;

	export let showWinLoss: boolean = true;
	function showModal() {
		pushState('', {
			showModal: true,
			matchId: match.id
		});
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="flex justify-center place-items-center"
	on:click={() => {
		if (!readOnly && !$page.state.showModal) {
			showModal();
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
