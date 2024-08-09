<script lang="ts">
	import * as Popover from '$components/ui/popover';
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

{#snippet matchView()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex place-items-center justify-center text-pretty"
		onclick={() => {
			if (!readOnly && !$page.state.showModal) {
				showModal(match?.id, 'pool');
			}
		}}
	>
		<span
			class="text-pretty rounded p-1 {showWinLoss &&
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
			class="text-pretty rounded p-1 {showWinLoss &&
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
{/snippet}
{#if readOnly}
	<Popover.Root>
		<Popover.Trigger>
			{@render matchView()}
		</Popover.Trigger>

		<Popover.Content>
			{#if match?.team1_score && match?.team2_score}
				<p>{match?.team1_score} to {match?.team2_score}</p>
			{:else}
				<p>Not played yet</p>
			{/if}
		</Popover.Content>
	</Popover.Root>
{:else}
	{@render matchView()}
{/if}
