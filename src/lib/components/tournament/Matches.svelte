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

	export let matches: Matches;
	export let tournament: Event;
	export let teams: Teams;
	export let readOnly: boolean = false;

	async function generateMatches(): Promise<void> {
		try {
			const res: Matches | undefined = await $matches.create(tournament, teams.teams);
			if (!res) {
				throw new Error('Failed to create matches');
			}
		} catch (err: any) {
			error(err?.body?.message);
		}
	}

	let matchesSubscription: RealtimeChannel | undefined;
	async function subscribeToMatches() {
		matchesSubscription = await matches.subscribeToDB();
	}
	subscribeToMatches();
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

	<Table striped={true} hoverable={true} class="border-solid border-2 rounded">
		<TableHead>
			<TableHeadCell>Round</TableHeadCell>
			{#each Array(tournament.courts) as _, i}
				<TableHeadCell>Court {i + 1}</TableHeadCell>
			{/each}
		</TableHead>
		<TableBody>
			<!-- Need to iterate over ROUNDs here and fill each court -->
			{#each Object.keys(matchesForEachRound) as round}
				{@const matchesForRound = matchesForEachRound[round].sort(
					(a, b) => a.round - b.round || a.court - b.court
				)}
				<TableBodyRow>
					<TableBodyCell>{round}</TableBodyCell>
					<!-- Can have multiple matches per round if we have multiple courts -->
					{#each matchesForRound as match}
						<TableBodyCell>
							<ViewMatch {matches} {match} {readOnly} />
						</TableBodyCell>
					{/each}
				</TableBodyRow>
			{/each}
		</TableBody>
	</Table>
{/if}

{#if !readOnly}
	<div class="m-2">
		<button
			class="bg-nord-10 hover:bg-nord-9 text-white dark:text-nord-1 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
			type="button"
			on:click={generateMatches}
		>
			Generate matches</button
		>
	</div>
{/if}
