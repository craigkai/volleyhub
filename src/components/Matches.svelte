<script lang="ts">
	import { error } from '$lib/toast';
	import * as Table from '$components/ui/table';
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches.svelte';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import * as Alert from '$components/ui/alert/index.js';
	import type { HttpError } from '@sveltejs/kit';
	import type { Teams } from '$lib/teams.svelte';
	import { onMount } from 'svelte';

	let {
		matches = $bindable(),
		tournament = $bindable(),
		teams = $bindable(),
		readOnly = false,
		defaultTeam = $bindable()
	}: {
		matches: Matches;
		tournament: Event;
		teams: Teams;
		readOnly: Boolean;
		defaultTeam: { value: string; label: string };
	} = $props();

	let showGenerateMatchesAlert = $state(false);

	async function checkGenerateMatches() {
		if ((matches?.matches?.length ?? 0) > 0) {
			showGenerateMatchesAlert = true;
		} else {
			generateMatches();
		}
	}

	let matchesSubscription: RealtimeChannel | undefined;
	async function subscribeToMatches() {
		matchesSubscription = await matches.subscribeToMatches();
	}

	onMount(() => {
		if ((matches?.matches?.length ?? 0) > 0) subscribeToMatches();
	});

	async function generateMatches(): Promise<void> {
		try {
			const res: Matches | undefined = await matches.create(tournament, teams.teams);
			if (!res) {
				error('Failed to create matches');
			} else {
				if (!matchesSubscription) {
					subscribeToMatches();
				}
			}
		} catch (err) {
			error((err as HttpError).toString());
		}
		showGenerateMatchesAlert = false;
	}
</script>

<div class="block text-gray-700 text-sm font-bold mb-4">Matches:</div>

{#if matches.matches && matches.matches.length > 0}
	{@const matchesForEachRound = matches.matches.reduce((accumulator, currentValue) => {
		// @ts-ignore
		if (accumulator[currentValue.round]) {
			// @ts-ignore
			accumulator[currentValue.round].push(currentValue);
		} else {
			// @ts-ignore
			accumulator[currentValue.round] = [currentValue];
		}
		return accumulator;
	}, {})}

	<Table.Root class="table-auto border-solid border-2 rounded">
		<Table.Header>
			<Table.Row>
				{#each Array(tournament.courts) as _, i}
					<Table.Head>Court {i + 1}</Table.Head>
				{/each}
				{#if tournament.refs === 'teams'}
					<Table.Head>Ref</Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#each Object.keys(matchesForEachRound) as round, i}
				{@const matchesForRound = matchesForEachRound[round].sort(
					(a, b) => a.round - b.round || a.court - b.court
				)}

				<Table.Row>
					{#each Array(tournament.courts) as _, court}
						{@const match = matchesForRound[court]}
						{#if match}
							{@const matchComplete = match.team1_score !== null && match.team2_score !== null}
							{@const teamsForMatch = [
								match.public_matches_team1_fkey.name,
								match.public_matches_team2_fkey.name
							]}
							{@const hasDefaultTeam = teamsForMatch.includes(defaultTeam)}
							{@const defaultTeamWin =
								match.public_matches_team1_fkey.name == defaultTeam
									? match.team1_score > match.team2_score
									: match.team2_score > match.team1_score}
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
						<Table.Cell
							class={matchesForRound[0]?.public_matches_ref_fkey?.name == defaultTeam
								? 'p-2 border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
								: 'p-2'}
						>
							{matchesForRound[0]?.public_matches_ref_fkey?.name}
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
				<Alert.Description
					>You already have some match content, are you sure you want to wipe that?</Alert.Description
				>
				<div class="flex gap-2">
					<button
						class="text-black bg-blue-400 hover:bg-blue-600 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						onclick={generateMatches}>Yes</button
					>
					<button
						class="text-black bg-blue-400 hover:bg-blue-600 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						onclick={() => (showGenerateMatchesAlert = false)}>No</button
					>
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
			Generate matches</button
		>
	</div>
{/if}
