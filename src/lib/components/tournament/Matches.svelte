<script lang="ts">
	import { error } from '$lib/toast';
	import type { Tournament } from '$lib/tournament';
	import {
		Spinner,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let tournament: Tournament;

	const matchesPromise = tournament.loadMatches();
</script>

<div class="block text-gray-700 text-sm font-bold mb-2">Matches:</div>
{#await matchesPromise}
	<Spinner color="blue" />
{:then}
	{#if tournament.matches && tournament.matches.length > 0}
		<!--
			Reduce our matches into a dict where the key is the round the
			match is played in.
		-->
		{@const matchesForEachRound = tournament.matches.reduce((accumulator, currentValue) => {
			if (accumulator[currentValue.round]) {
				accumulator[currentValue.round].push(currentValue);
			} else {
				accumulator[currentValue.round] = [currentValue];
			}
			return accumulator;
		}, {})}

		<Table>
			<TableHead>
				<TableHeadCell>Round</TableHeadCell>
				<TableHeadCell>Ref</TableHeadCell>
				{#each Array(tournament.settings.courts) as _, i}
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
						<TableBodyCell>Some Ref</TableBodyCell>
						{#each matchesForRound as match}
							<TableBodyCell
								>{match.matches_team1_fkey.name} vs {match.matches_team2_fkey.name}</TableBodyCell
							>
						{/each}
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
{/await}

<div class="m-2">
	<button
		class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
		type="button"
		on:click={() =>
			tournament
				.createMatches()
				.then((res) => (tournament = res))
				.catch((err) => error(err.body.message))}
	>
		Generate matches</button
	>
</div>
