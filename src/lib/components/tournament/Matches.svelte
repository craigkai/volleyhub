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

<h2>Matches:</h2>
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

<button
	class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
	type="button"
	on:click={() =>
		tournament
			.createMatches()
			.then((res) => (tournament = res))
			.catch((err) => error(err.body.message))}
>
	Create matches</button
>
