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
	export let defaultTeam: string;

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

	<Table hoverable={true} class="table-auto border-solid border-2 rounded">
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
				{@const matchesIncomplete = matchesForRound.filter(
					(match) => !match.team1_score || !match.team2_score
				)}
				<TableBodyRow>
					<TableBodyCell
						>{#if defaultTeam && [matchesForRound[0].matches_team1_fkey.name, matchesForRound[1].matches_team2_fkey.name].includes(defaultTeam)}
							<svg
								class="w-[17px] h-[17px] text-gray-800 dark:text-white"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								fill="green"
								viewBox="0 0 22 20"
							>
								<path
									d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
								/>
							</svg>
						{/if}
						{round}</TableBodyCell
					>
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
