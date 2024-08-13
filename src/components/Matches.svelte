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
	import type { PageData } from './$types';

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

	let seenEvent = $state.snapshot(data.tournament);
	let seenTeam = $state.snapshot(data.teams.teams);

	// When number of matches change or courts, clear matches or teams
	$effect(() => {
		const eventAttributes = ['courts', 'pools', 'refs'];

		let deleted = false;
		for (var i = 0; i < eventAttributes.length; i++) {
			const key = eventAttributes[i];

			if (!$state.is(data.tournament[key], seenEvent[key])) {
				try {
					data.matches.deleteAllMatches();
					deleted = true;
				} catch (err) {
					console.error(`Failed to delete matches: ${err as HttpError}`);
					toast.error('Failed to delete matches');
				}
			}

			if (deleted) break;
		}

		if (!deleted && $state.snapshot(data.teams.teams).length !== seenTeam.length) {
			try {
				data.matches.deleteAllMatches();
				deleted = true;
			} catch (err) {
				console.error(`Failed to delete matches: ${err as HttpError}`);
				toast.error('Failed to delete matches');
			}
		}

		if (deleted) {
			seenEvent = Object.assign(data.tournament);
			seenTeam = Object.assign(data.teams);
		}
	});

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

	async function generateMatches(): Promise<void> {
		try {
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

<div class="rounded rounded-2xl p-2 text-xs dark:bg-gray-800 md:text-lg">
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
								(m: MatchRow) => m.court === court && m.round.toString() === round.toString()
							)}
							{#if match}
								{@const matchComplete = match.team1_score !== null && match.team2_score !== null}
								{@const teamsForMatch = [
									match.public_matches_team1_fkey.name,
									match.public_matches_team2_fkey.name
								]}
								{@const hasDefaultTeam = defaultTeam ? teamsForMatch.includes(defaultTeam) : false}
								{@const defaultTeamWin =
									match.public_matches_team1_fkey.name == defaultTeam
										? (match.team1_score ?? 0) > (match.team2_score ?? 0)
										: (match.team2_score ?? 0) > (match.team1_score ?? 0)}
								{@const rowDivClass = defaultTeamWin
									? 'border-solid border-2 border-green-400 bg-green-200 dark:bg-green-700 dark:border-green-700'
									: 'border-solid border-2 border-red-400 bg-red-200 dark:bg-red-700 dark:border-red-700'}
								<div
									class="min-w-[100px] {hasDefaultTeam
										? matchComplete
											? 'flex-1 p-2 ' + rowDivClass
											: 'flex-1 border-2 border-solid border-yellow-300 bg-yellow-200 p-2 dark:border-gray-400 dark:bg-gray-400'
										: 'flex-1 p-2'}"
								>
									<ViewMatch {match} {readOnly} showWinLoss={!hasDefaultTeam} />
								</div>
							{:else}
								<div class="flex-1 p-2"></div>
							{/if}
						{/each}
						{#if data.tournament.refs === 'teams'}
							{@const ref = data.matches.matches.find(
								(m: MatchRow) => m.round.toString() === round.toString()
							)?.public_matches_ref_fkey}
							<div
								class="flex place-items-center justify-end text-pretty {ref?.name == defaultTeam
									? 'flex-1 border-2 border-solid border-yellow-300 bg-yellow-200 p-2 dark:border-gray-400 dark:bg-gray-400'
									: 'flex-1 p-2'}"
							>
								{ref?.name}
							</div>
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
