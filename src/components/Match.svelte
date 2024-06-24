<script lang="ts">
	import * as Tooltip from '$components/ui/tooltip';
	import { page } from '$app/stores';
	import { showModal } from '$lib/helper.svelte';
	import { onMount, onDestroy } from 'svelte';

	let {
		match,
		readOnly = false,
		showWinLoss = true
	}: { match: MatchRow; readOnly: boolean; showWinLoss: boolean } = $props();

	const winClass = 'bg-green-300 dark:bg-green-700';
	const lossClass = 'bg-red-300 dark:bg-red-700';

	let tooltipVisible = false;

	function toggleTooltip() {
		tooltipVisible = !tooltipVisible;
	}

	function handleOutsideClick(event: MouseEvent) {
		if (tooltipVisible && !event.target.closest('.tooltip-content')) {
			tooltipVisible = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleOutsideClick);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleOutsideClick);
	});
</script>

<style>
	.tooltip-content {
		position: relative;
		display: inline-block;
	}

	.tooltip-content div {
		visibility: hidden;
		background-color: #555;
		color: #fff;
		text-align: center;
		border-radius: 6px;
		padding: 5px 0;
		position: absolute;
		z-index: 1;
		bottom: 125%; /* Position the tooltip above the text */
		left: 50%;
		margin-left: -60px;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.tooltip-content:hover div {
		visibility: visible;
		opacity: 1;
	}

	.tooltip-content.show div {
		visibility: visible;
		opacity: 1;
	}
</style>

<div class="tooltip-content">
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
			ontouchstart={toggleTooltip}
			onclick={toggleTooltip}
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

	<Tooltip.Content class:show={tooltipVisible}>
		{#if match?.team1_score && match?.team2_score}
			<div>{match?.team1_score} to {match?.team2_score}</div>
		{/if}
	</Tooltip.Content>
</div>
