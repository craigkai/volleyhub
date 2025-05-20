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

	let { readOnly = false, defaultTeam, data } = $props();

	let showGenerateMatchesAlert = $state(false);
	let matchesSubscription: RealtimeChannel | undefined = $state();
	let subscriptionStatus: any | undefined = $derived(data.matches?.subscriptionStatus);

	async function checkGenerateMatches() {
		if ((data.matches?.matches?.length ?? 0) > 0) {
			showGenerateMatchesAlert = true;
		} else {
			generateMatches();
		}
	}

	onMount(() => {
		if ((data.matches?.matches?.length ?? 0) > 0) subscribeToMatches();
	});

	onDestroy(() => {
		if (matchesSubscription) matchesSubscription.unsubscribe();
	});

	async function handleVisibilityChange() {
		if (typeof document !== 'undefined' && !document.hidden) {
			if (!data.matches.subscriptionStatus && matchesSubscription?.state === 'closed') {
				await subscribeToMatches();
			}
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

	// Function to check if a round contains matches with the default team
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
</script>

<svelte:document onvisibilitychange={handleVisibilityChange} />
<svelte:window ononline={handleOnline} onoffline={handleOffline} />

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<!-- Left side: Heading + Status -->
		<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-white">Tournament Matches</h2>
			<div
				class="flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium"
				class:bg-emerald-100={subscriptionStatus === 'SUBSCRIBED'}
				class:text-emerald-700={subscriptionStatus === 'SUBSCRIBED'}
				class:bg-red-100={subscriptionStatus !== 'SUBSCRIBED'}
				class:text-red-700={subscriptionStatus !== 'SUBSCRIBED'}
			>
				{#if subscriptionStatus === 'SUBSCRIBED'}
					<Zap class="h-3.5 w-3.5" />
					<span>Live</span>
				{:else}
					<ZapOff class="h-3.5 w-3.5" />
					<span>Offline</span>
				{/if}
			</div>
		</div>

		<!-- Right side: Buttons -->
		{#if !readOnly}
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Button
					onclick={checkGenerateMatches}
					class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none dark:bg-emerald-600 dark:hover:bg-emerald-700"
					disabled={loading}
				>
					<RefreshCw class={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
					<span>Generate Matches</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if showGenerateMatchesAlert}
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
					<div class="mt-4 flex gap-2">
						<Button
							onclick={generateMatches}
							class="inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500/40 focus:outline-none dark:bg-amber-700 dark:hover:bg-amber-600"
						>
							Yes, generate new matches
						</Button>
						<Button
							onclick={() => (showGenerateMatchesAlert = false)}
							class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
			class="flex h-40 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex flex-col items-center gap-2">
				<div
					class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"
					role="status"
				>
					<span class="sr-only">Loading...</span>
				</div>
				<p class="text-sm text-gray-500 dark:text-gray-400">Generating matches...</p>
			</div>
		</div>
	{:else if data.matches && data.matches.matches && data.matches?.matches?.length > 0}
		<div
			class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			{#if defaultTeam}
				<div
					class="border-b border-yellow-100 bg-yellow-50 px-4 py-2 dark:border-yellow-900/30 dark:bg-yellow-900/20"
				>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full bg-yellow-300 dark:bg-yellow-500"></div>
						<p class="text-sm font-medium text-yellow-800 dark:text-yellow-300">
							Viewing matches for: <span class="font-semibold">{defaultTeam}</span>
						</p>
					</div>
				</div>
			{/if}

			<div class="-mx-4 overflow-x-auto sm:mx-0">
				<Table.Root class="m-2 min-w-full p-2 sm:table-fixed">
					<Table.Header>
						<Table.Row class="bg-gray-50 dark:bg-gray-900">
							<Table.Head
								class="w-24 py-3 pl-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Round
							</Table.Head>
							{#each Array(data.tournament.courts) as _, i}
								{@const index = i + 1}
								<Table.Head
									class="py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Court {index}
								</Table.Head>
							{/each}
							{#if data.tournament.refs === 'teams'}
								<Table.Head
									class="py-3 pr-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
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
										class="py-3 pl-4 text-sm font-medium text-gray-800 dark:text-gray-200 {hasDefaultTeam
											? 'default-team-indicator'
											: ''}"
									>
										{round + 1}
									</Table.Cell>

									{#each Array(data.tournament.courts) as _, court}
										{@const match = data.matches.matches.find(
											(m: Match) =>
												m?.court === court && (m?.round ?? 0).toString() === round?.toString()
										)}
										<Table.Cell class="p-2 text-center">
											{#if match}
												<div class="min-w-[180px]">
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
										<Table.Cell class="p-2 pr-4 text-center">
											<div class="min-w-[120px]">
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
			class="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
		>
			<RefreshCw class="mb-2 h-10 w-10 text-gray-400" />
			<h3 class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
				No matches generated
			</h3>
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Click "Generate Matches" to create the tournament schedule
			</p>
		</div>
	{/if}
</div>

<style>
	/* Ensure table is responsive */
	:global(.courts-container) {
		overflow-x: auto;
	}

	/* Focus styles for better accessibility */
	:global(button:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}

	/* Default team row highlighting */
	:global(.default-team-row) {
		background-color: rgba(253, 224, 71, 0.15) !important; /* Light yellow */
		border-left: 4px solid rgb(253, 224, 71) !important;
	}

	:global(.dark .default-team-row) {
		background-color: rgba(253, 224, 71, 0.05) !important;
		border-left: 4px solid rgb(202, 179, 57) !important;
	}

	:global(.default-team-indicator) {
		position: relative;
		font-weight: 600 !important;
		color: rgb(161, 98, 7) !important; /* amber-700 */
	}

	:global(.dark .default-team-indicator) {
		color: rgb(252, 211, 77) !important; /* amber-300 */
	}

	:global(.default-team-indicator::before) {
		content: '•';
		color: rgb(251, 191, 36); /* amber-400 */
		font-size: 1.5rem;
		line-height: 0;
		position: absolute;
		left: -0.5rem;
		top: 50%;
		transform: translateY(-40%);
	}
</style>
