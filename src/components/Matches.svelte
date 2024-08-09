<script lang="ts">
	import * as Table from '$components/ui/table';
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import * as Alert from '$components/ui/alert/index.js';
	import type { HttpError } from '@sveltejs/kit';
	import type { Teams } from '$lib/teams.svelte';
	import Zap from 'lucide-svelte/icons/zap';
	import Zapoff from 'lucide-svelte/icons/zap-off';
	import { Event } from '$lib/event.svelte';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-french-toast';

	let {
		readOnly = $bindable(false),
		defaultTeam,
		teams,
		tournament,
		matches
	}: {
		readOnly: boolean;
		defaultTeam: string | null;
		teams: Teams;
		tournament: Event;
		matches: Matches;
	} = $props();

	let showGenerateMatchesAlert = $state(false);
	let matchesSubscription: RealtimeChannel | undefined = $state();
	let subscriptionStatus: any | undefined = $state(matches?.subscriptionStatus);

	$effect(() => {
		matches;
		subscriptionStatus = matches?.subscriptionStatus;
	});

	async function checkGenerateMatches() {
		if ((matches?.matches?.length ?? 0) > 0) {
			showGenerateMatchesAlert = true;
		} else {
			generateMatches();
		}
	}

	onMount(async () => {
		if ((matches?.matches?.length ?? 0) > 0) await subscribeToMatches();
	});

	onDestroy(() => {
		if (matchesSubscription) matchesSubscription.unsubscribe();
	});

	async function subscribeToMatches() {
		try {
			matchesSubscription = await matches.subscribeToMatches();
		} catch (err) {
			toast.error(`Failed to subscribe to matches: ${err as HttpError}`);
			console.toast.error('Subscription error:', err);
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
			const res: Matches | undefined = await matches.create(tournament, teams.teams);
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

	const rounds = Math.max.apply(
		Math,
		matches?.matches?.map(function (m) {
			return m.round;
		}) ?? [0]
	);
</script>

<div class="mb-4 block flex text-sm font-bold text-gray-700">
	Matches {#if subscriptionStatus && subscriptionStatus === 'SUBSCRIBED'}
		<Zap class="fill-green-200 text-green-500" />
	{:else}
		<Zapoff class="fill-red-200 text-red-500" />
	{/if}:
</div>

{#if matches && matches.matches && matches?.matches?.length > 0}
	<Table.Root class="table-auto">
		<Table.Header>
			<Table.Row>
				{#each Array(tournament.courts) as _, i}
					{@const index = i + 1}
					<Table.Head>Court {index}</Table.Head>
				{/each}
				{#if tournament.refs === 'teams'}
					<Table.Head>Ref</Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#if rounds > 0}
				{#each Array(rounds) as _, i}
					{@const round = i + 1}
					<Table.Row>
						{#each Array(tournament.courts) as _, court}
							{@const match = matches.matches.find(
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
								{@const rowTdClass = defaultTeamWin
									? 'border-solid border-2 border-green-400 bg-green-200 dark:bg-green-700 dark:border-green-700'
									: 'border-solid border-2 border-red-400 bg-red-200 dark:bg-red-700 dark:border-red-700'}
								<Table.Cell
									class={hasDefaultTeam
										? matchComplete
											? 'p-2 ' + rowTdClass
											: 'border-2 border-solid border-yellow-300 bg-yellow-200 p-2 dark:border-gray-400 dark:bg-gray-400'
										: 'p-2'}
								>
									<ViewMatch {match} {readOnly} showWinLoss={!hasDefaultTeam} />
								</Table.Cell>
							{:else}
								<Table.Cell class="p-2"></Table.Cell>
							{/if}
						{/each}
						{#if tournament.refs === 'teams'}
							{@const ref = matches.matches.find(
								(m: MatchRow) => m.round.toString() === round.toString()
							)?.public_matches_ref_fkey}
							<Table.Cell
								class={ref?.name == defaultTeam
									? 'border-2 border-solid border-yellow-300 bg-yellow-200 p-2 dark:border-gray-400 dark:bg-gray-400'
									: 'p-2'}
							>
								{ref?.name}
							</Table.Cell>
						{/if}
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>
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
