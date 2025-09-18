<script lang="ts">
	import ViewMatch from './Match.svelte';
	import { Button } from '$components/ui/button';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import SkipForward from 'lucide-svelte/icons/skip-forward';
	import Calendar from 'lucide-svelte/icons/calendar';
	import * as Popover from '$components/ui/popover/index.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import MoreVertical from 'lucide-svelte/icons/more-vertical';
	import toast from 'svelte-5-french-toast';

	let {
		readOnly = false,
		defaultTeam,
		data,
		deleteRound,
		deleteFromRound,
		setCurrentRound
	} = $props();

	let currentViewRound = $state(data.tournament.current_round ?? 0);

	// Calculate total rounds from matches
	let totalRounds = $derived(
		Math.max.apply(Math, data.matches?.matches?.map((m: { round: number }) => m.round) ?? [0]) +
			1 || 1
	);

	// Get matches for current viewing round
	let roundMatches = $derived(
		data.matches.matches.filter((match: any) => match.round === currentViewRound)
	);

	// Check if round has default team
	function roundHasDefaultTeam(): boolean {
		if (!defaultTeam) return false;
		return roundMatches.some((m: any) => {
			const team1 = data.teams.teams.find((t: { id: number; name: string }) => t.id === m.team1);
			const team2 = data.teams.teams.find((t: { id: number; name: string }) => t.id === m.team2);
			return team1?.name === defaultTeam.name || team2?.name === defaultTeam.name;
		});
	}

	// Check if round has default team as referee
	function roundHasDefaultTeamRef(): boolean {
		if (!defaultTeam) return false;
		return roundMatches.some((m: any) => {
			const referee = data.teams.teams.find(
				(t: { id: number; name: string }) => t.id === m.referee_id
			);
			return referee?.name === defaultTeam.name;
		});
	}

	function jumpToCurrentRound() {
		currentViewRound = data.tournament.current_round ?? 0;
	}

	function nextRound() {
		if (currentViewRound < totalRounds - 1) {
			currentViewRound++;
		}
	}

	function prevRound() {
		if (currentViewRound > 0) {
			currentViewRound--;
		}
	}

	async function handleDeleteRound() {
		await deleteRound(currentViewRound);
		// Adjust view if we deleted the last round
		if (currentViewRound >= totalRounds - 1 && currentViewRound > 0) {
			currentViewRound--;
		}
	}

	async function handleDeleteFromRound() {
		await deleteFromRound(currentViewRound);
		// Adjust view if we deleted the current round
		if (currentViewRound >= totalRounds - 1 && currentViewRound > 0) {
			currentViewRound--;
		}
	}
</script>

<div class="space-y-4">
	<!-- Round Navigation Header -->
	<div
		class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="flex items-center gap-3">
			<Button
				variant="outline"
				size="sm"
				onclick={prevRound}
				disabled={currentViewRound <= 0}
				class="h-8 w-8 p-0"
			>
				<ChevronLeft class="h-4 w-4" />
			</Button>

			<div class="text-center">
				<h2 class="text-lg font-bold text-gray-900 dark:text-white">
					Round {currentViewRound + 1}
				</h2>
				<p class="text-xs text-gray-500 dark:text-gray-400">
					{currentViewRound + 1} of {totalRounds}
				</p>
			</div>

			<Button
				variant="outline"
				size="sm"
				onclick={nextRound}
				disabled={currentViewRound >= totalRounds - 1}
				class="h-8 w-8 p-0"
			>
				<ChevronRight class="h-4 w-4" />
			</Button>
		</div>

		<div class="flex items-center gap-2">
			<!-- Current Round Badge/Button -->
			{#if currentViewRound === (data.tournament.current_round ?? 0)}
				<span
					class="inline-block rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
				>
					Current
				</span>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					onclick={jumpToCurrentRound}
					class="h-8 px-2 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
				>
					<SkipForward class="mr-1 h-3 w-3" />
					Go to Current
				</Button>
			{/if}

			<!-- Round Actions Menu -->
			{#if !readOnly}
				<Popover.Root>
					<Popover.Trigger
						class="inline-flex h-8 w-8 items-center justify-center rounded border-0 bg-transparent p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<MoreVertical class="h-4 w-4" />
					</Popover.Trigger>
					<Popover.Content class="w-48 p-1" align="end">
						<div class="space-y-1">
							{#if currentViewRound !== (data.tournament.current_round ?? 0)}
								<Button
									variant="ghost"
									size="sm"
									class="w-full justify-start text-xs"
									onclick={() => setCurrentRound(currentViewRound)}
								>
									<Calendar class="mr-2 h-3 w-3" />
									Set as Current
								</Button>
							{/if}
							<Button
								variant="ghost"
								size="sm"
								class="w-full justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
								onclick={handleDeleteRound}
							>
								<Trash2 class="mr-2 h-3 w-3" />
								Delete This Round
							</Button>
							{#if currentViewRound < totalRounds - 1}
								<Button
									variant="ghost"
									size="sm"
									class="w-full justify-start text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
									onclick={handleDeleteFromRound}
								>
									<Trash2 class="mr-2 h-3 w-3" />
									Delete From Here
								</Button>
							{/if}
						</div>
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>
	</div>

	<!-- Round Matches Grid -->
	<div
		class="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		class:default-team-highlight={roundHasDefaultTeam()}
	>
		{#if roundMatches.length === 0}
			<div class="py-8 text-center text-gray-500 dark:text-gray-400">
				<Calendar class="mx-auto mb-2 h-12 w-12 opacity-50" />
				<p class="text-sm">No matches in this round</p>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each roundMatches as match}
					<div class="rounded border border-gray-200 p-3 dark:border-gray-600">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-gray-500 dark:text-gray-400">
								Court {(match.court ?? 0) + 1}
							</span>
							{#if match.referee_id}
								{@const referee = data.teams.teams.find((t: any) => t.id === match.referee_id)}
								{#if referee}
									<span class="text-xs text-gray-500 dark:text-gray-400">
										Ref: {referee.name}
									</span>
								{/if}
							{/if}
						</div>
						<ViewMatch matches={data.matches} {match} teams={data.teams} {readOnly} {defaultTeam} />
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Round Progress Indicator -->
	<div class="flex items-center justify-center">
		<div class="flex gap-1">
			{#each Array(totalRounds) as _, index}
				<button
					onclick={() => (currentViewRound = index)}
					aria-label="Jump to round {index + 1}"
					class="h-2 w-8 rounded-full transition-colors duration-200"
					class:bg-indigo-500={index === currentViewRound}
					class:bg-indigo-200={index === (data.tournament.current_round ?? 0) &&
						index !== currentViewRound}
					class:bg-gray-200={index !== currentViewRound &&
						index !== (data.tournament.current_round ?? 0)}
					class:dark:bg-indigo-400={index === currentViewRound}
					class:dark:bg-indigo-700={index === (data.tournament.current_round ?? 0) &&
						index !== currentViewRound}
					class:dark:bg-gray-600={index !== currentViewRound &&
						index !== (data.tournament.current_round ?? 0)}
				></button>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Green highlight for when default team is playing */
	.default-team-highlight {
		border: 2px solid #d1fae5;
		background-color: #f0fdf4;
	}

	:global(.dark) .default-team-highlight {
		border-color: #16a34a;
		background-color: rgba(34, 197, 94, 0.15);
	}
</style>
