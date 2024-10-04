<script lang="ts">
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import type { HttpError } from '@sveltejs/kit';
	import Zap from 'lucide-svelte/icons/zap';
	import Zapoff from 'lucide-svelte/icons/zap-off';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	import EditRef from './EditRef.svelte';
	import { MatchSupabaseDatabaseService } from '$lib/database/match';
	import { Match } from '$lib/match.svelte';
	import * as Table from '$components/ui/table/index.js';
	import * as Alert from '$components/ui/alert/index.js';

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

	async function handleVisibilityChange() {
		if (
			!document.hidden &&
			!data.matches.subscriptionStatus &&
			matchesSubscription?.state === 'closed'
		) {
			subscribeToMatches();
		}
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
	<div
		class="rounded-2xl p-2 text-xs dark:bg-gray-800 md:text-base"
		onvisibilitychange={handleVisibilityChange}
		onfocus={handleVisibilityChange}
	>
		{#if data.matches && data.matches.matches && data.matches?.matches?.length > 0}
			<div class="courts-container">
				<Table.Root>
					<Table.Header>
						<Table.Row class="table-header">
							{#each Array(data.tournament.courts) as _, i}
								{@const index = i + 1}
								<Table.Head class="p-2 text-center font-bold">
									Court {index}
								</Table.Head>
							{/each}
							{#if data.tournament.refs === 'teams'}
								<Table.Head class="p-2 text-center font-bold">Ref</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{#if rounds > 0}
							{#each Array(rounds) as _, round}
								<Table.Row
									class={round % 2 ? 'table-row bg-gray-100 dark:bg-gray-500' : 'table-row'}
								>
									{#each Array(data.tournament.courts) as _, court}
										{@const match = data.matches.matches.find(
											(m: Match) =>
												m?.court === court && (m?.round ?? 0).toString() === round?.toString()
										)}
										<Table.Cell class="text-center">
											{#if match}
												<ViewMatch
													matches={data.matches}
													{match}
													teams={data.teams}
													{readOnly}
													{defaultTeam}
													courts={data.tournament.courts ?? 1}
												/>
											{/if}
										</Table.Cell>
									{/each}
									{#if data.tournament.refs === 'teams'}
										{@const matchesPerRound = data.matches.matches.filter(
											(m: MatchRow) => m.round.toString() === round.toString()
										)}
										<Table.Cell class="text-center">
											<EditRef {readOnly} {matchesPerRound} teams={data.teams} {defaultTeam} />
										</Table.Cell>
									{/if}
								</Table.Row>
							{/each}
						{/if}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}

		{#if showGenerateMatchesAlert}
			<div class="m-2">
				<Alert.Root>
					<Alert.Title>Generate new matches?</Alert.Title>
					<Alert.Description>
						You already have some match content, are you sure you want to wipe that?
					</Alert.Description>
					<div class="flex gap-2">
						<button
							class="focus:shadow-outline text-whit e rounded bg-blue-400 px-4 py-2 font-bold
text-black hover:bg-blue-600 focus:outline-none dark:text-nord-1"
							onclick={generateMatches}
						>
							Yes
						</button>
						<button
							class="focus:shadow-outline text-whit e rounded bg-blue-400 px-4 py-2 font-bold
text-black hover:bg-blue-600 focus:outline-none dark:text-nord-1"
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
				class="focus:shadow-outline focus:outline-n one rounded bg-blue-400 px-4 py-2 font-bold text-white
hover:bg-blue-600 dark:text-nord-1"
				type="button"
				onclick={checkGenerateMatches}
			>
				Generate matches
			</button>
		</div>

		{#if !readOnly}
			<div class="text-center">
				<button onclick={addMatch} class="cursor-pointer text-blue-500">Add Match</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.courts-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 10px;
	}

	.table-header,
	.table-row {
		display: contents;
	}

	@media (max-width: 768px) {
		.courts-container {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}
	}
</style>
