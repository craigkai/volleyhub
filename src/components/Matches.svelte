<script lang="ts">
	import { error } from '$lib/toast';
	import { Event } from '$lib/event';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import ViewMatch from './Match.svelte';
	import { Matches } from '$lib/matches';
	import type { RealtimeChannel } from '@supabase/supabase-js';
	import type { Teams } from '$lib/teams';
	import { Alert, Button } from 'flowbite-svelte';
	import type { HttpError } from '@sveltejs/kit';

	export let matches: Matches;
	export let tournament: Event;
	export let teams: Teams;
	export let readOnly: boolean = false;
	export let defaultTeam: string;

	let showGenerateMatchesAlert: boolean = false;

	async function checkGenerateMatches() {
		if (($matches?.matches?.length ?? 0) > 0) {
			showGenerateMatchesAlert = true;
		} else {
			generateMatches();
		}
	}

	let matchesSubscription: RealtimeChannel | undefined;
	async function subscribeToMatches() {
		matchesSubscription = await matches.subscribeToPoolMatches();
	}

	async function generateMatches(): Promise<void> {
		try {
			const res: Matches | undefined = await $matches.create(tournament, teams.teams);
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

	if (!$matches.matches) {
		subscribeToMatches();
	}

	const defaultTdClass = 'px-6 py-4 whitespace-nowrap font-medium';
</script>

<div class="block text-gray-700 text-sm font-bold">Matches:</div>

{#if $matches.matches && $matches.matches.length > 0}
	<!--
			Reduce our matches into a dict where the key is the round the
			match is played in.
		-->
	{@const matchesForEachRound = $matches.matches.reduce((accumulator, currentValue) => {
		if (accumulator[currentValue.round]) {
			accumulator[currentValue.round].push(currentValue);
		} else {
			accumulator[currentValue.round] = [currentValue];
		}
		return accumulator;
	}, {})}

	<Table hoverable={true} class="table-auto border-solid border-2 rounded">
		<TableHead>
			{#each Array(tournament.courts) as _, i}
				<TableHeadCell>Court {i + 1}</TableHeadCell>
			{/each}
			{#if tournament.refs === 'teams'}
				<TableHeadCell>Ref</TableHeadCell>
			{/if}
		</TableHead>
		<TableBody>
			<!-- Need to iterate over ROUNDs here and fill each court -->
			{#each Object.keys(matchesForEachRound) as round}
				{@const matchesForRound = matchesForEachRound[round].sort(
					(a, b) => a.round - b.round || a.court - b.court
				)}

				<TableBodyRow>
					<!-- Can have multiple matches per round if we have multiple courts -->
					{#each matchesForRound as match}
						{@const matchComplete = match.team1_score !== null && match.team2_score !== null}
						{@const teamsForMatch = [match.matches_team1_fkey.name, match.matches_team2_fkey.name]}
						{@const hasDefaultTeam = teamsForMatch.includes(defaultTeam)}
						{@const defaultTeamWin =
							match.matches_team1_fkey.name == defaultTeam
								? match.team1_score > match.team2_score
								: match.team2_score > match.team1_score}
						{@const rowTdClass = defaultTeamWin
							? 'border-solid border-2 border-green-400 bg-green-200 dark:bg-green-700 dark:border-green-700'
							: 'border-solid border-2 border-red-400 bg-red-200 dark:bg-red-700 dark:border-red-700'}
						<TableBodyCell
							tdClass={hasDefaultTeam
								? matchComplete
									? defaultTdClass + rowTdClass
									: defaultTdClass +
										'border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
								: defaultTdClass}
						>
							<ViewMatch {match} {readOnly} showWinLoss={!hasDefaultTeam} />
						</TableBodyCell>
					{/each}
					{#if tournament.refs === 'teams'}
						<TableBodyCell
							tdClass={matchesForRound[0]?.matches_ref_fkey?.name == defaultTeam
								? defaultTdClass +
									'border-solid border-2 border-yellow-300 bg-yellow-200 dark:bg-gray-400 dark:border-gray-400'
								: defaultTdClass}
						>
							{matchesForRound[0]?.matches_ref_fkey?.name}
						</TableBodyCell>
					{/if}
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

{#if !readOnly}
	{#if showGenerateMatchesAlert}
		<div class="m-2">
			<Alert color="red">
				<div class="flex items-center gap-3">
					<span class="text-lg font-medium">Generate new matches?</span>
				</div>
				<p class="mt-2 mb-4 text-sm">
					You already have some match content, are you sure you want to wipe that?
				</p>
				<div class="flex gap-2">
					<Button class="text-black" size="xs" on:click={generateMatches}>Yes</Button>
					<Button class="text-black" size="xs" on:click={() => (showGenerateMatchesAlert = false)}
						>No</Button
					>
				</div>
			</Alert>
		</div>
	{/if}

	<div class="m-2">
		<button
			class="bg-nord-10 hover:bg-nord-9 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
			type="button"
			on:click={checkGenerateMatches}
		>
			Generate matches</button
		>
	</div>
{/if}
