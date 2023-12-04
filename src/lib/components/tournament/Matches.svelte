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
		<Table>
			<TableHead>
				<TableHeadCell>Round</TableHeadCell>
				<TableHeadCell>Court</TableHeadCell>
				<TableHeadCell>Home</TableHeadCell>
				<TableHeadCell>Away</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each tournament.matches as match}
					<TableBodyRow>
						<TableBodyCell>tbd</TableBodyCell>
						<TableBodyCell>tbd</TableBodyCell>
						<TableBodyCell>{match.matches_team1_fkey.name}</TableBodyCell>
						<TableBodyCell>{match.matches_team2_fkey.name}</TableBodyCell>
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
