<script lang="ts">
	import { error } from '$lib/toast';
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
	import { onMount } from 'svelte';

	let {
		matches = $bindable(),
		tournament = $bindable(),
		teams = $bindable(),
		readOnly = $bindable(false),
		defaultTeam
	}: {
		matches: Matches;
		tournament: Event;
		teams: Teams;
		readOnly: boolean;
		defaultTeam: string | null;
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

	async function subscribeToMatches() {
		try {
			matchesSubscription = await matches.subscribeToMatches();
		} catch (err) {
			error(`Failed to subscribe to matches: ${err as HttpError}`);
			console.error('Subscription error:', err);
		}
	}

	async function generateMatches(): Promise<void> {
		try {
			if (matchesSubscription) {
				await matchesSubscription.unsubscribe();
				matchesSubscription = undefined;
			}

			const res: Matches | undefined = await matches.create(tournament, teams.teams);
			if (!res) {
				error('Failed to create matches');
			} else {
				// Ensure there's a delay to resubscribe
				await new Promise((r) => setTimeout(r, 1000));
				await subscribeToMatches();
			}
		} catch (err) {
			error((err as HttpError).toString());
		}
		showGenerateMatchesAlert = false;
	}

	const rounds = Math.max.apply(
		Math,
		matches?.matches?.map(function (m) {
			return m.round;
		}) ?? [0]
	);
</script>

<div class="block text-gray-700 text-sm font-bold mb-4 flex">
	Matches {#if subscriptionStatus && subscriptionStatus === 'SUBSCRIBED'}
		<Zap class="text-green-500 fill-green-200" />
	{:else}
		<Zapoff class="text-red-500 fill-red-200" />
	{/if}:
</div>

{#if matches && matches.matches && matches?.matches?.length > 0}
	<Table.Root class="table-auto border-solid border-2 rounded">
		<Table.Header>
			<Table.Row>
				{#each Array(tournament.courts) as _, i}
					{@const index = i + 1}
					<Table.Head>Court {index + 1}</Table.Head>
				{/each}
				{#if tournament.refs === 'teams'}
					<Table.Head>Ref</Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>

		<Table.Body>
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
										: 'p-2 border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
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
								? 'p-2 border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
								: 'p-2'}
						>
							{ref?.name}
						</Table.Cell>
					{/if}
				</Table.Row>
			{/each}
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
						class="text-black bg-blue-400 hover:bg-blue-600 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						onclick={generateMatches}
					>
						Yes
					</button>
					<button
						class="text-black bg-blue-400 hover:bg-blue-600 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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
			class="bg-blue-400 hover:bg-blue-600 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
			type="button"
			onclick={checkGenerateMatches}
		>
			Generate matches
		</button>
	</div>
{/if}
