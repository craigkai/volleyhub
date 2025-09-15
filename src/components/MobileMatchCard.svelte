<script lang="ts">
	import { Button } from '$components/ui/button';
	import type { Team } from '$lib/team.svelte';
	import TrophyIcon from 'lucide-svelte/icons/trophy';
	import ClockIcon from 'lucide-svelte/icons/clock';
	import MapPinIcon from 'lucide-svelte/icons/map-pin';
	import UserIcon from 'lucide-svelte/icons/user';
	import EditIcon from 'lucide-svelte/icons/edit-2';
	import CheckCircleIcon from 'lucide-svelte/icons/check-circle';
	import PlayCircleIcon from 'lucide-svelte/icons/play-circle';
	import EditMatch from '$components/EditMatch.svelte';
	import * as Popover from '$components/ui/popover/index.js';

	let { match, teams, readOnly = false, defaultTeam, matches, isCurrentRound = false } = $props();

	const team1 = $derived(teams.teams.find((t: Team) => t.id === match.team1));
	const team2 = $derived(teams.teams.find((t: Team) => t.id === match.team2));
	const refTeam = $derived(match.ref ? teams.teams.find((t: Team) => t.id === match.ref) : null);

	const hasDefaultTeam = $derived(
		defaultTeam && (team1?.name === defaultTeam || team2?.name === defaultTeam)
	);

	const isComplete = $derived(match.state === 'COMPLETE');
	const hasScores = $derived(match?.team1_score != null && match?.team2_score != null);

	const team1IsWinner = $derived(
		hasScores && (match.team1_score ?? 0) > (match.team2_score ?? 0)
	);

	const team2IsWinner = $derived(
		hasScores && (match.team2_score ?? 0) > (match.team1_score ?? 0)
	);

	const defaultTeamWon = $derived(() => {
		if (!hasDefaultTeam || !hasScores) return false;
		if (team1?.name === defaultTeam) return team1IsWinner;
		if (team2?.name === defaultTeam) return team2IsWinner;
		return false;
	});

	const matchStatus = $derived.by(() => {
		if (isComplete) return 'complete';
		if (isCurrentRound) return 'current';
		return 'upcoming';
	});

	const statusIcon = $derived.by(() => {
		switch (matchStatus) {
			case 'complete': return CheckCircleIcon;
			case 'current': return PlayCircleIcon;
			default: return ClockIcon;
		}
	});

	const statusColor = $derived.by(() => {
		switch (matchStatus) {
			case 'complete': return 'text-green-500';
			case 'current': return 'text-blue-500';
			default: return 'text-gray-400';
		}
	});

	let showEditPopover = $state(false);
	let expanded = $state(false);
</script>

<div
	class="mobile-match-card rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
	class:default-team-highlight={hasDefaultTeam}
	class:match-won={hasDefaultTeam && defaultTeamWon}
	class:match-lost={hasDefaultTeam && !defaultTeamWon && isComplete}
	class:current-round={isCurrentRound}
>
	<!-- Status and Actions Header -->
	<div class="mb-3 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<svelte:component this={statusIcon} class="h-4 w-4 {statusColor}" />
			<span class="text-xs font-medium text-gray-600 capitalize dark:text-gray-300">
				{matchStatus}
			</span>
			{#if isCurrentRound}
				<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
					Current Round
				</span>
			{/if}
		</div>

		{#if !readOnly}
			<Button
				variant="ghost"
				size="sm"
				class="h-8 w-8 p-0"
				onclick={() => showEditPopover = true}
			>
				<EditIcon class="h-4 w-4" />
			</Button>
		{/if}
	</div>

	<!-- Teams and Score -->
	<div class="space-y-3">
		<!-- Team 1 -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				{#if team1IsWinner && hasScores}
					<TrophyIcon class="h-4 w-4 text-amber-500" />
				{:else}
					<div class="h-4 w-4"></div>
				{/if}
				<span
					class="font-medium text-gray-900 dark:text-white"
					class:text-emerald-600={team1?.name === defaultTeam}
					class:dark:text-emerald-400={team1?.name === defaultTeam}
					class:font-bold={team1?.name === defaultTeam}
				>
					{team1?.name || 'TBD'}
				</span>
			</div>
			{#if hasScores}
				<span
					class="text-lg font-bold text-gray-900 dark:text-white"
					class:text-green-600={team1IsWinner}
				>
					{match.team1_score}
				</span>
			{/if}
		</div>

		<!-- VS Divider -->
		<div class="flex justify-center">
			<span class="text-xs font-medium text-gray-400 dark:text-gray-500">VS</span>
		</div>

		<!-- Team 2 -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				{#if team2IsWinner && hasScores}
					<TrophyIcon class="h-4 w-4 text-amber-500" />
				{:else}
					<div class="h-4 w-4"></div>
				{/if}
				<span
					class="font-medium text-gray-900 dark:text-white"
					class:text-emerald-600={team2?.name === defaultTeam}
					class:dark:text-emerald-400={team2?.name === defaultTeam}
					class:font-bold={team2?.name === defaultTeam}
				>
					{team2?.name || 'TBD'}
				</span>
			</div>
			{#if hasScores}
				<span
					class="text-lg font-bold text-gray-900 dark:text-white"
					class:text-green-600={team2IsWinner}
				>
					{match.team2_score}
				</span>
			{/if}
		</div>
	</div>

	<!-- Expandable Details -->
	<button
		class="mt-4 w-full text-left"
		onclick={() => expanded = !expanded}
	>
		<div class="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
			<span class="text-xs text-gray-500 dark:text-gray-400">
				{expanded ? 'Hide' : 'Show'} Details
			</span>
			<div
				class="h-4 w-4 transform transition-transform duration-200"
				class:rotate-180={expanded}
			>
				<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
				</svg>
			</div>
		</div>
	</button>

	<!-- Expanded Details -->
	{#if expanded}
		<div class="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-700">
			<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
				<MapPinIcon class="h-3 w-3" />
				<span>Court {(match.court ?? 0) + 1}</span>
				<span class="mx-2">•</span>
				<span>Round {(match.round ?? 0) + 1}</span>
			</div>

			{#if refTeam}
				<div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
					<UserIcon class="h-3 w-3" />
					<span>Referee: {refTeam.name}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Edit Popover -->
{#if !readOnly}
	<Popover.Root bind:open={showEditPopover}>
		<Popover.Trigger class="hidden" />
		<Popover.Content class="w-80">
			<div class="space-y-4">
				<div class="space-y-2">
					<h4 class="font-medium leading-none">Edit Match</h4>
					<p class="text-sm text-muted-foreground">
						Update the match score and details.
					</p>
				</div>
				<EditMatch {match} {teams} {matches} />
			</div>
		</Popover.Content>
	</Popover.Root>
{/if}

<style>
	.mobile-match-card {
		transition: all 0.2s ease;
	}

	.default-team-highlight {
		border-left: 4px solid rgb(16, 185, 129);
		background-color: rgba(16, 185, 129, 0.02);
	}

	.match-won {
		border-left-color: rgb(34, 197, 94);
		background-color: rgba(34, 197, 94, 0.05);
	}

	.match-lost {
		border-left-color: rgb(239, 68, 68);
		background-color: rgba(239, 68, 68, 0.05);
	}

	.current-round {
		border-color: rgb(59, 130, 246);
		box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
	}

	:global(.dark) .default-team-highlight {
		background-color: rgba(16, 185, 129, 0.05);
	}

	:global(.dark) .match-won {
		background-color: rgba(34, 197, 94, 0.08);
	}

	:global(.dark) .match-lost {
		background-color: rgba(239, 68, 68, 0.08);
	}
</style>