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
				{@const matchesIncomplete = matchesForRound.filter(
					(match) => !match.team1_score || !match.team2_score
				)}
				<TableBodyRow>
					<TableBodyCell>{round}</TableBodyCell>
					<!-- Can have multiple matches per round if we have multiple courts -->
					{#each matchesForRound as match}
						<TableBodyCell>
							{#if defaultTeam && [match.matches_team1_fkey.name, match.matches_team2_fkey.name].includes(defaultTeam)}
								<div class="flex justify-center">
									<svg
										class="w-[17px] h-[17px] text-gray-800 dark:text-white"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 21 20"
									>
										<path
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="0.6"
											d="m11.479 1.712 2.367 4.8a.532.532 0 0 0 .4.292l5.294.769a.534.534 0 0 1 .3.91l-3.83 3.735a.534.534 0 0 0-.154.473l.9 5.272a.535.535 0 0 1-.775.563l-4.734-2.49a.536.536 0 0 0-.5 0l-4.73 2.487a.534.534 0 0 1-.775-.563l.9-5.272a.534.534 0 0 0-.154-.473L2.158 8.48a.534.534 0 0 1 .3-.911l5.294-.77a.532.532 0 0 0 .4-.292l2.367-4.8a.534.534 0 0 1 .96.004Z"
										/>
									</svg>
								</div>
							{/if}
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
