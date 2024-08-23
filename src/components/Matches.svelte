<script lang="ts">
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import * as Alert from '$components/ui/alert/index.js';
	import type { HttpError } from '@sveltejs/kit';
	import Zap from 'lucide-svelte/icons/zap';
	import Zapoff from 'lucide-svelte/icons/zap-off';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	import EditRef from './EditRef.svelte';
	import { MatchSupabaseDatabaseService } from '$lib/database/match';
	import { Match } from '$lib/match.svelte';
	// import { dndzone, type DndEvent } from 'svelte-dnd-action';

	let {
		readOnly = false,
		defaultTeam,
		data
	} = $props<{
		readOnly: Boolean;
		defaultTeam: String | null;
		data: any;
	}>();

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

	onMount(async () => {
		if ((data.matches?.matches?.length ?? 0) > 0) await subscribeToMatches();
	});

	onDestroy(() => {
		if (matchesSubscription) matchesSubscription.unsubscribe();
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
			// Unsubscribe from existing subscription if any
			if (matchesSubscription) {
				await matchesSubscription.unsubscribe();
				matchesSubscription = undefined;
			}

			// Create new matches
			const res: Matches | undefined = await data.matches.create(
				data.tournament,
				$state.snapshot(data.teams.teams)
			);
			if (!res) {
				toast.error('Failed to create matches');
				return;
			}

			// Resubscribe to matches updates
			await subscribeToMatches();
		} catch (err) {
			toast.error((err as HttpError).toString());
		} finally {
			showGenerateMatchesAlert = false;
			loading = false;
		}
	}

	// Calculate the total number of rounds based on existing matches
	const rounds = $derived(
		Math.max.apply(
			Math,
			data.matches?.matches?.map(function (m: { round: any }) {
				return m.round;
			}) ?? [0]
		) + 1
	);

	// Function to add a new match manually
	async function addMatch() {
		const matchSupabaseDatabaseService = new MatchSupabaseDatabaseService(
			data.matches.databaseService.supabaseClient
		);
		const roundValue = rounds;

		for (let i = 0; i < data.tournament.courts; i++) {
			const newMatch = {
				team1: undefined,
				team2: undefined,
				round: roundValue,
				court: i,
				event_id: data.tournament.id
			};

			const newMatchInstance = new Match(matchSupabaseDatabaseService);

			try {
				await newMatchInstance.create(newMatch);
				toast.success('Match added successfully');
			} catch (err) {
				toast.error('Failed to add match');
			}
		}
	}

	// function handleDndConsider(e: { detail: { items: any } }) {
	// 	const { items } = e.detail;

	// 	// Temporarily update the order of matches based on the current drag position
	// 	items.forEach((match: Match, index: number) => {
	// 		if (data?.matches?.matches) {
	// 			const matchToUpdate = data.matches.matches.find((m: Match) => m.id === match.id);
	// 			if (matchToUpdate) matchToUpdate.round = index;
	// 		}
	// 	});
	// }

	// // Handle reordering of matches after a drag event
	// function handleDragEnd(event: { detail: { items: any } }) {
	// 	// Save the new state for the matches
	// }
</script>

<div class="mb-4 block flex justify-center text-sm font-bold">
	{#if subscriptionStatus && subscriptionStatus === 'SUBSCRIBED'}
		<Zap class="fill-green-200 text-green-500" />
	{:else}
		<Zapoff class="fill-red-200 text-red-500" />
	{/if}
</div>

{#if loading}
	<div
		class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-blue-500 motion-reduce:animate-[spin_1.5s_linear_infinite]"
		role="status"
	>
		<span
			class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
			>Loading...</span
		>
	</div>
{:else}
	<div class="rounded rounded-2xl p-2 text-xs dark:bg-gray-800 md:text-base">
		{#if data.matches && data.matches.matches && data.matches?.matches?.length > 0}
			<div class="flex w-full flex-col">
				<div class="flex w-full">
					{#each Array(data.tournament.courts) as _, i}
						{@const index = i + 1}
						<div
							class="flex- p-2 text-center {data.tournament.courts < 2
								? 'text-lg'
								: 'text-base'} font-bold"
						>
							Court {index}
						</div>
					{/each}
					{#if data.tournament.refs === 'teams'}
						<div
							class="flex-1 p-2 text-end {data.tournament.courts < 2
								? 'text-lg'
								: 'text-base'} font-bold"
						>
							Ref
						</div>
					{/if}
				</div>

				{#if rounds > 0}
					<!-- <section
						use:dndzone={{ items: $state.snapshot(data.matches.matches) }}
						onconsider={handleDndConsider}
						onfinalize={handleDragEnd}
					> -->
					<section>
						{#each Array(rounds) as _, round}
							<div
								class="flex w-full items-center justify-center rounded p-2 {round % 2
									? 'bg-gray-100 dark:bg-gray-500'
									: ''}"
							>
								{#each Array(data.tournament.courts) as _, court}
									{@const match = data.matches.matches.find(
										(m: Match) =>
											m?.court === court && (m?.round ?? 0).toString() === round?.toString()
									)}
									{#if match}
										<ViewMatch
											matches={data.matches}
											{match}
											teams={data.teams}
											{readOnly}
											{defaultTeam}
											courts={data.tournament.courts ?? 1}
										></ViewMatch>
									{/if}
								{/each}
								{#if data.tournament.refs === 'teams'}
									{@const matchesPerRound = data.matches.matches.filter(
										(m: MatchRow) => m.round.toString() === round.toString()
									)}

									<div class={data.tournament.courts < 2 ? 'text-lg' : 'text-base'}>
										<EditRef {readOnly} {matchesPerRound} teams={data.teams} {defaultTeam} />
									</div>
								{/if}
							</div>
						{/each}
					</section>
				{/if}
			</div>
			{#if !readOnly}
				<div class="flex-1 p-2 text-center">
					<button onclick={() => addMatch()} class="text-blue-500">Add Match</button>
				</div>
			{/if}
		{/if}

		{#if !readOnly}
			{#if showGenerateMatchesAlert}
				<div class="m-2">
					<Alert.Root>
						<Alert.Title>Generate new matches?</Alert.Title>
						<Alert.Description>
							You already have some match content, are you sure you want to wipe that?
						</Alert.Description>
						<div class="flex gap-2">
							<button
								class="focus:shadow-outline rounded bg-blue-400 px-4 py-2 font-bold text-black text-white hover:bg-blue-600 focus:outline-none dark:text-nord-1"
								onclick={generateMatches}
							>
								Yes
							</button>
							<button
								class="focus:shadow-outline rounded bg-blue-400 px-4 py-2 font-bold text-black text-white hover:bg-blue-600 focus:outline-none dark:text-nord-1"
								onclick={() => (showGenerateMatchesAlert = false)}
							>
								No
							</button>
						</div>
					</Alert.Root>
				</div>
			{/if}

			<div class="m-2 flex justify-center">
				<button
					class="focus:shadow-outline rounded bg-blue-400 px-4 py-2 font-bold text-white hover:bg-blue-600 focus:outline-none dark:text-nord-1"
					type="button"
					onclick={checkGenerateMatches}
				>
					Generate matches
				</button>
			</div>
		{/if}
	</div>
{/if}
