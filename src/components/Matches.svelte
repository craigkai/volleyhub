<script lang="ts">
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import type { HttpError } from '@sveltejs/kit';
	import Zap from 'lucide-svelte/icons/zap';
	import ZapOff from 'lucide-svelte/icons/zap-off';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-5-french-toast';
	import EditRef from './EditRef.svelte';
	import { Match } from '$lib/match.svelte';
	import * as Table from '$components/ui/table/index.js';
	import * as Alert from '$components/ui/alert/index.js';
	import { Button } from '$components/ui/button';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { MatchSupabaseDatabaseService } from '$lib/database/match';
	import Plus from 'lucide-svelte/icons/plus';
	import PlusCircle from 'lucide-svelte/icons/plus-circle';
	import Calendar from 'lucide-svelte/icons/calendar';

	let { readOnly = false, defaultTeam, data } = $props();

	const matcheSupabaseDatabaseService = new MatchSupabaseDatabaseService(
		data.tournament.databaseService.supabaseClient
	);
	const match = new Match(matcheSupabaseDatabaseService);

	let showGenerateMatchesAlert = $state(false);
	let matchesSubscription: RealtimeChannel | undefined = $state();
	let subscriptionStatus: any | undefined = $derived(data.matches?.subscriptionStatus);
	let tableContainer: HTMLElement | undefined = $state();

	onMount(() => {
		if ((data.matches?.matches?.length ?? 0) > 0) subscribeToMatches();
	});

	onDestroy(() => {
		if (matchesSubscription) matchesSubscription.unsubscribe();
	});

	function handleVisibilityChange() {
		if (typeof document !== 'undefined' && !document.hidden) {
			if (!data.matches.subscriptionStatus && matchesSubscription?.state === 'closed') {
				subscribeToMatches();
			}
		}
	}

	function checkGenerateMatches() {
		if (readOnly) return;

		if ((data.matches?.matches?.length ?? 0) > 0) {
			showGenerateMatchesAlert = true;
		} else {
			generateMatches();
		}
	}

	function handleOnline() {
		if (matchesSubscription?.state === 'closed') {
			subscribeToMatches();
			toast.success('You are back online. Reconnecting...');
		}
	}

	function handleOffline() {
		toast.error('You are offline. Matches cannot be updated.');
	}

	$effect(() => {
		if (subscriptionStatus === 'SUBSCRIBED') {
			data.matches.load(data.matches.event_id);
		}
	});

	async function subscribeToMatches() {
		try {
			matchesSubscription = await data.matches.subscribeToMatches();
		} catch (err) {
			console.error(`Failed to subscribe to matches: ${err as HttpError}`);
			toast.error('Subscription error!');
		}
	}

	let loading: boolean = $state(false);
	async function generateMatches(): Promise<void> {
		try {
			loading = true;
			if (matchesSubscription) {
				await matchesSubscription.unsubscribe();
				matchesSubscription = undefined;
			}

			const res: Matches | undefined = await data.matches.create(
				data.tournament,
				$state.snapshot(data.teams.teams)
			);
			data.matches.matches = res?.matches ?? [];

			if (!res) {
				toast.error('Failed to create matches');
				return;
			}

			await subscribeToMatches();
		} catch (err) {
			toast.error((err as HttpError).toString());
		} finally {
			showGenerateMatchesAlert = false;
			loading = false;
		}
	}

	let rounds = $state(
		Math.max.apply(Math, data.matches?.matches?.map((m: { round: any }) => m.round) ?? [0]) + 1 || 1
	);

	function roundHasDefaultTeam(roundIndex: number): boolean {
		if (!defaultTeam) return false;

		return data.matches.matches.some((m: Match) => {
			if (typeof m.round === 'undefined' || m.round.toString() !== roundIndex.toString())
				return false;

			const team1 = data.teams.teams.find((t: any) => t.id === m.team1);
			const team2 = data.teams.teams.find((t: any) => t.id === m.team2);

			return team1?.name === defaultTeam || team2?.name === defaultTeam;
		});
	}

	function addMatch(round: number, court: number) {
		const newMatch = {
			event_id: data.matches.event_id,
			court,
			round,
			state: 'INCOMPLETE' as 'INCOMPLETE'
		};

		match
			.create(newMatch)
			.then(() => toast.success('Match added'))
			.catch((err: { message: string }) => toast.error('Failed to add match: ' + err.message));
	}

	let addingRound = $state(false);

	async function addRound() {
		if (addingRound) return;

		addingRound = true;
		const newRound = rounds;
		const numCourts = data.tournament.courts ?? 1;

		try {
			for (let court = 0; court < numCourts; court++) {
				await match.create({
					event_id: data.matches.event_id,
					round: newRound,
					court,
					state: 'INCOMPLETE'
				});
			}

			rounds++;
			await data.matches.load(data.matches.event_id);
			toast.success(
				`Added round ${newRound + 1} with ${numCourts} ${numCourts === 1 ? 'court' : 'courts'}`
			);
		} catch (err: any) {
			toast.error('Failed to add round: ' + err.message);
		} finally {
			addingRound = false;
		}
	}

	async function setCurrentRound(round: number) {
		if (round < 0 || round >= rounds) {
			toast.error('Invalid round number');
			return;
		}

		try {
			await data.tournament.setCurrentRound(round);

			currentRound = data.tournament.current_round ?? 0;
			toast.success(`Set current round to ${round + 1}`);
		} catch (err: any) {
			toast.error('Failed to set current round: ' + err.message);
		}
	}

	let currentRound = $derived(data.tournament.current_round ?? 0);
</script>

<svelte:document onvisibilitychange={handleVisibilityChange} />
<svelte:window ononline={handleOnline} onoffline={handleOffline} />

<div class="space-y-4 p-3 sm:space-y-6 sm:p-0">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
			<h2 class="text-base font-semibold text-gray-800 sm:text-lg dark:text-white">
				Tournament Matches
			</h2>
			<div
				class="flex h-5 w-fit items-center gap-1 rounded-full px-2 text-xs font-medium sm:h-6"
				class:bg-emerald-100={subscriptionStatus === 'SUBSCRIBED'}
				class:text-emerald-700={subscriptionStatus === 'SUBSCRIBED'}
				class:bg-red-100={subscriptionStatus !== 'SUBSCRIBED'}
				class:text-red-700={subscriptionStatus !== 'SUBSCRIBED'}
			>
				{#if subscriptionStatus === 'SUBSCRIBED'}
					<Zap class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
					<span>Live</span>
				{:else}
					<ZapOff class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
					<span>Offline</span>
				{/if}
			</div>
		</div>

		{#if !readOnly}
			<div class="flex justify-center sm:w-auto sm:justify-end">
				<Button
					onclick={checkGenerateMatches}
					class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none sm:w-auto sm:px-4 dark:bg-emerald-600 dark:hover:bg-emerald-700"
					disabled={loading}
				>
					<RefreshCw class={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					<span>Generate Matches</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if !readOnly && showGenerateMatchesAlert}
		<Alert.Root
			class="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
		>
			<div class="flex items-start gap-3">
				<AlertCircle class="h-5 w-5 text-amber-500" />
				<div class="flex-1">
					<Alert.Title class="mb-1 text-base font-semibold">Generate new matches?</Alert.Title>
					<Alert.Description class="text-sm">
						You already have match data. Generating new matches will delete all existing matches and
						scores.
					</Alert.Description>
					<div class="mt-4 flex flex-col gap-2 sm:flex-row">
						<Button
							onclick={generateMatches}
							class="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500/40 focus:outline-none dark:bg-amber-700 dark:hover:bg-amber-600"
						>
							Yes, generate new matches
						</Button>
						<Button
							onclick={() => (showGenerateMatchesAlert = false)}
							class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
						>
							Cancel
						</Button>
					</div>
				</div>
			</div>
		</Alert.Root>
	{/if}

	{#if loading}
		<div
			class="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 sm:h-40 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex flex-col items-center gap-2">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 sm:h-10 sm:w-10"
					role="status"
				>
					<span class="sr-only">Loading...</span>
				</div>
				<p class="text-xs text-gray-500 sm:text-sm dark:text-gray-400">Generating matches...</p>
			</div>
		</div>
	{:else if data.matches && data.matches.matches && data.matches?.matches?.length > 0}
		<div
			class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			{#if defaultTeam}
				<div
					class="border-b border-yellow-100 bg-yellow-50 px-3 py-2 sm:px-4 dark:border-yellow-900/30 dark:bg-yellow-900/20"
				>
					<div class="flex items-center gap-2">
						<div class="h-2 w-2 rounded-full bg-yellow-300 sm:h-3 sm:w-3 dark:bg-yellow-500"></div>
						<p class="text-xs font-medium text-yellow-800 sm:text-sm dark:text-yellow-300">
							Viewing matches for: <span class="font-semibold">{defaultTeam}</span>
						</p>
					</div>
				</div>
			{/if}

			<div class="relative">
				<div
					class="border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs text-gray-500 md:hidden dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400"
				>
					<div class="flex items-center justify-center gap-1">
						<ChevronLeft class="h-3 w-3" />
						<span>Swipe to see all courts</span>
						<ChevronRight class="h-3 w-3" />
					</div>
				</div>
			</div>

			<div
				bind:this={tableContainer}
				class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600 overflow-x-auto"
			>
				<Table.Root class="">
					<Table.Header>
						<Table.Row class="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900">
							<Table.Head
								class="sticky left-0 z-10 w-12 bg-gray-50 py-2 pl-2 text-left text-xs font-medium text-gray-700 sm:w-16 sm:py-3 sm:pl-4 sm:text-sm dark:bg-gray-900 dark:text-gray-300"
							>
								Round
							</Table.Head>
							{#each Array(data.tournament.courts) as _, i}
								{@const index = i + 1}
								<Table.Head
									class="py-2 text-center text-xs font-medium text-gray-700 sm:py-3 sm:text-sm dark:text-gray-300"
								>
									Court {index}
								</Table.Head>
							{/each}
							{#if data.tournament.refs === 'teams'}
								<Table.Head
									class="py-2 pr-2 text-center text-xs font-medium text-gray-700 sm:py-3 sm:pr-4 sm:text-sm dark:text-gray-300"
								>
									Referee
								</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{#if rounds > 0}
							{#each Array(rounds) as _, round}
								{@const hasDefaultTeam = roundHasDefaultTeam(round)}

								<Table.Row
									class="border-t border-gray-200 dark:border-gray-700 {`
										${round % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
										${hasDefaultTeam ? 'default-team-row' : ''}
									`}"
								>
									<Table.Cell
										class="sticky left-0 z-10 bg-white py-2 pl-2 text-xs font-medium text-gray-800 sm:py-3 sm:pl-4 sm:text-sm
		dark:bg-gray-800 dark:text-gray-200"
										style="top: 32px;"
									>
										<div class="flex items-center justify-between gap-2">
											<span>Round {round + 1}</span>

											{#if round === currentRound}
												<span
													class="ml-2 inline-block rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
												>
													Current
												</span>
											{:else if !readOnly && round !== currentRound}
												<Button
													variant="ghost"
													size="sm"
													class="ml-auto px-1 py-0.5 text-[10px] text-indigo-500 hover:underline"
													onclick={() => setCurrentRound(round)}
												>
													Set Current
												</Button>
											{/if}
										</div>
									</Table.Cell>

									{#each Array(data.tournament.courts) as _, court}
										{@const match = data.matches.matches.find(
											(m: Match) =>
												m?.court === court && (m?.round ?? 0).toString() === round?.toString()
										)}
										<Table.Cell class="p-1 text-center sm:p-2">
											{#if match}
												<ViewMatch
													matches={data.matches}
													{match}
													teams={data.teams}
													{readOnly}
													{defaultTeam}
													courts={data.tournament.courts ?? 1}
												/>
											{:else if !readOnly}
												<div class="group relative">
													<Button
														size="sm"
														variant="outline"
														class="min-h-[60px] w-full border-2 border-dashed border-gray-300 bg-gray-50/50 text-gray-500 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 focus:border-emerald-400 focus:bg-emerald-50 focus:text-emerald-700 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
														onclick={() => addMatch(round, court)}
													>
														<div class="flex flex-col items-center gap-1">
															<Plus
																class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
															/>
															<span class="text-xs font-medium">Add Match</span>
														</div>
													</Button>

													<!-- Subtle hover effect overlay -->
													<div
														class="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-br from-emerald-400/0 to-emerald-600/0 transition-all duration-300 group-hover:from-emerald-400/5 group-hover:to-emerald-600/10"
													></div>
												</div>
											{/if}
										</Table.Cell>
									{/each}

									{#if data.tournament.refs === 'teams'}
										{@const matchesPerRound = data.matches.matches.filter(
											(m: MatchRow) => m.round.toString() === round.toString()
										)}
										<Table.Cell class="p-1 pr-2 text-center sm:p-2 sm:pr-4">
											<EditRef {readOnly} {matchesPerRound} teams={data.teams} {defaultTeam} />
										</Table.Cell>
									{/if}
								</Table.Row>
							{/each}
						{/if}
						{#if !readOnly}
							<Table.Row
								class="border-t-2 border-dashed border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-900/50"
							>
								<Table.Cell
									colspan={data.tournament.courts + (data.tournament.refs === 'teams' ? 2 : 1)}
									class="p-6"
								>
									<div class="flex flex-col items-center gap-3">
										<div class="group relative">
											<Button
												onclick={addRound}
												size="lg"
												disabled={addingRound}
												class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl focus:ring-4 focus:ring-emerald-200 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 {addingRound
													? 'add-round-loading'
													: ''}"
											>
												<PlusCircle
													class="plus-circle h-5 w-5 transition-transform duration-200 group-hover:rotate-90 {addingRound
														? 'animate-spin'
														: ''}"
												/>
												<span>{addingRound ? 'Adding Round...' : 'Add New Round'}</span>
												{#if !addingRound}
													<Calendar class="h-4 w-4 opacity-75" />
												{/if}
											</Button>

											<!-- Glow effect -->
											<div
												class="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20"
											></div>
										</div>

										<p class="max-w-xs text-center text-xs text-gray-500 dark:text-gray-400">
											Create round {rounds + 1} with {data.tournament.courts}
											{data.tournament.courts === 1 ? 'court' : 'courts'}
										</p>
									</div>
								</Table.Cell>
							</Table.Row>
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{:else}
		<div
			class="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 sm:h-40 dark:border-gray-700 dark:bg-gray-800/50"
		>
			{#if !readOnly}
				<RefreshCw class="mb-2 h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
			{/if}
			{#if !readOnly}
				<h3 class="mb-1 text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
					No matches generated
				</h3>

				<p class="text-xs text-gray-500 dark:text-gray-400">
					Click "Generate Matches" to create the tournament schedule
				</p>
			{:else}
				<p class="text-xs text-gray-500 dark:text-gray-400">
					No matches available. Please contact the tournament organizer.
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.scrollbar-thin::-webkit-scrollbar {
		height: 4px;
	}

	@media (min-width: 640px) {
		.scrollbar-thin::-webkit-scrollbar {
			height: 6px;
		}
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background-color: rgb(209, 213, 219);
		border-radius: 20px;
	}

	:global(.default-team-row) {
		background-color: rgba(253, 224, 71, 0.15) !important;
		border-left: 3px solid rgb(253, 224, 71) !important;
	}

	@media (min-width: 640px) {
		:global(.default-team-row) {
			border-left: 4px solid rgb(253, 224, 71) !important;
		}
	}

	:global(.dark .default-team-row) {
		background-color: rgba(253, 224, 71, 0.05) !important;
		border-left: 3px solid rgb(202, 179, 57) !important;
	}

	@media (min-width: 640px) {
		:global(.dark .default-team-row) {
			border-left: 4px solid rgb(202, 179, 57) !important;
		}
	}

	:global(Button:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}

	/* Enhanced button animations */
	:global(.group:hover .plus-icon) {
		transform: scale(1.1) rotate(90deg);
	}

	/* Subtle pulse animation for add buttons */
	@keyframes subtle-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	:global(.add-match-btn:hover) {
		animation: subtle-pulse 2s ease-in-out infinite;
	}

	/* Custom focus styles for better accessibility */
	:global(.add-round-btn:focus-visible) {
		outline: 3px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}

	/* Loading state for add round button */
	:global(.add-round-loading) {
		pointer-events: none;
		opacity: 0.7;
	}

	:global(.add-round-loading .plus-circle) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
