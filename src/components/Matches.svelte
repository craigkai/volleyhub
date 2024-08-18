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
	// @ts-ignore
	import type { PageData } from './$types';
	import EditRef from './EditRef.svelte';

	let {
		readOnly = false,
		defaultTeam,
		data
	} = $props<{
		readOnly: Boolean;
		defaultTeam: String | null;
		data: PageData;
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
			await new Promise((r) => setTimeout(r, 2000));
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

	const rounds = $derived(
		Math.max.apply(
			Math,
			data.matches?.matches?.map(function (m: { round: any }) {
				return m.round;
			}) ?? [0]
		)
	);
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
		class="text-surface inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
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
						<div class="flex-1 p-2 text-center font-bold">
							Court {index}
						</div>
					{/each}
					{#if data.tournament.refs === 'teams'}
						<div class="flex-1 p-2 text-center font-bold">Ref</div>
					{/if}
				</div>

				{#if rounds > 0}
					{#each Array(rounds) as _, i}
						{@const round = i + 1}
						<div class="flex w-full rounded {i % 2 ? 'bg-gray-100 dark:bg-gray-500' : ''}">
							{#each Array(data.tournament.courts) as _, court}
								{@const match = data.matches.matches.find(
									(m: MatchRow) => m?.court === court && m?.round.toString() === round?.toString()
								)}
								{#if match}
									<ViewMatch
										matches={data.matches}
										{match}
										teams={data.teams}
										{readOnly}
										{defaultTeam}
									/>
								{:else}
									<div class="flex-1 p-2 text-center">-</div>
								{/if}
							{/each}
							{#if data.tournament.refs === 'teams'}
								{@const matchesPerRound = data.matches.matches.filter(
									(m: MatchRow) => m.round.toString() === round.toString()
								)}
								<EditRef {matchesPerRound} teams={data.teams} {defaultTeam} />
							{/if}
						</div>
					{/each}
				{/if}
			</div>
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
