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

	let { readOnly = false, defaultTeam, data, onVisibilityChange, onOnline, onOffline } = $props();

	let showGenerateMatchesAlert = $state(false);
	let matchesSubscription: RealtimeChannel | undefined = $state();
	let subscriptionStatus: any | undefined = $derived(data.matches?.subscriptionStatus);
	let tableContainer: HTMLElement | undefined = $state();
	let isMobile = $state(false);

	onMount(() => {
		if ((data.matches?.matches?.length ?? 0) > 0) subscribeToMatches();
		checkMobileView();
		window.addEventListener('resize', checkMobileView);

		return () => {
			window.removeEventListener('resize', checkMobileView);
		};
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

	async function subscribeToMatches() {
		try {
			matchesSubscription = await data.matches.subscribeToMatches();
			data.matches.load(data.matches.event_id);
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

	const rounds = $derived(
		Math.max.apply(Math, data.matches?.matches?.map((m: { round: any }) => m.round) ?? [0]) + 1
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

	function checkMobileView() {
		isMobile = window.innerWidth < 768;
	}
</script>

<svelte:document onvisibilitychange={onVisibilityChange ?? handleVisibilityChange} />
<svelte:window ononline={onOnline ?? handleOnline} onoffline={onOffline ?? handleOffline} />

<div class="space-y-4 p-3 sm:space-y-6 sm:p-0">
	<!-- Mobile-optimized header -->
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
			<div class="flex w-full justify-center sm:w-auto sm:justify-end">
				<Button
					onclick={checkGenerateMatches}
					class="inline-flex w-full items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none sm:w-auto sm:px-4 dark:bg-emerald-600 dark:hover:bg-emerald-700"
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

			{#if isMobile}
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
			{/if}

			<div
				bind:this={tableContainer}
				class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600 overflow-x-auto"
			>
				<Table.Root class="min-w-full">
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
										{round + 1}
									</Table.Cell>

									{#each Array(data.tournament.courts) as _, court}
										{@const match = data.matches.matches.find(
											(m: Match) =>
												m?.court === court && (m?.round ?? 0).toString() === round?.toString()
										)}
										<Table.Cell class="p-1 text-center sm:p-2">
											{#if match}
												<div class="min-w-[140px] sm:min-w-[180px]">
													<ViewMatch
														matches={data.matches}
														{match}
														teams={data.teams}
														{readOnly}
														{defaultTeam}
														courts={data.tournament.courts ?? 1}
													/>
												</div>
											{/if}
										</Table.Cell>
									{/each}

									{#if data.tournament.refs === 'teams'}
										{@const matchesPerRound = data.matches.matches.filter(
											(m: MatchRow) => m.round.toString() === round.toString()
										)}
										<Table.Cell class="p-1 pr-2 text-center sm:p-2 sm:pr-4">
											<div class="min-w-[100px] sm:min-w-[120px]">
												<EditRef {readOnly} {matchesPerRound} teams={data.teams} {defaultTeam} />
											</div>
										</Table.Cell>
									{/if}
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{:else}
		<div
			class="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 sm:h-40 dark:border-gray-700 dark:bg-gray-800/50"
		>
			<RefreshCw class="mb-2 h-8 w-8 text-gray-400 sm:h-10 sm:w-10" />
			<h3 class="mb-1 text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
				No matches generated
			</h3>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Click "Generate Matches" to create the tournament schedule
			</p>
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
</style>
