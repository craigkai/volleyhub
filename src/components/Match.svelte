<script lang="ts">
	import * as Tooltip from '$components/ui/tooltip';
	import { page } from '$app/stores';
	import { showModal } from '$lib/helper.svelte';

	let {
		match,
		readOnly = false,
		showWinLoss = true
	}: { match: MatchRow; readOnly: boolean; showWinLoss: boolean } = $props();

	const winClass = 'bg-green-300 dark:bg-green-700';
	const lossClass = 'bg-red-300 dark:bg-red-700';
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex justify-center place-items-center"
			onclick={() => {
				if (!readOnly && !$page.state.showModal) {
					showModal(match?.id, 'pool');
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
				{match?.public_matches_team1_fkey?.name}</span
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
					: ''}">{match?.public_matches_team2_fkey?.name}</span
			>
		</div>
	</Tooltip.Trigger>

	<Tooltip.Content>
		{#if match?.team1_score && match?.team2_score}
			<p>{match?.team1_score} to {match?.team2_score}</p>
		{/if}
	</Tooltip.Content>
</Tooltip.Root>
