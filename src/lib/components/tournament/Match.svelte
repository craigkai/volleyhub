<script lang="ts">
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
		{#each tournament.matches as match}
			<Table>
				<TableHead>
					<TableHeadCell>Round</TableHeadCell>
					<TableHeadCell>Court</TableHeadCell>
					<TableHeadCell>Home</TableHeadCell>
					<TableHeadCell>Away</TableHeadCell>
				</TableHead>
				<TableBody>
					<TableBodyRow>
						<TableBodyCell>tbd</TableBodyCell>
						<TableBodyCell>tbd</TableBodyCell>
						<TableBodyCell>{match.matches_team1_fkey.name}</TableBodyCell>
						<TableBodyCell>{match.matches_team2_fkey.name}</TableBodyCell>
					</TableBodyRow>
				</TableBody>
			</Table>
		{/each}
	{/if}
{/await}
