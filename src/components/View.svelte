<script lang="ts">
	import type { Tournament } from '$lib/tournament';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let tournament: Tournament;
</script>

<div class="flex flex-row w-full">
	{#if tournament?.teams}
		<div class="w-1/2 m-1">
			<Table>
				<TableHead>
					<TableHeadCell>Teams</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each tournament?.teams as team}
						<TableBodyRow>
							<TableBodyCell>{team}</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}

	{#if tournament?.matches}
		<div class="w-1/2 m-1">
			<Table>
				<TableHead>
					<TableHeadCell>Round</TableHeadCell>
					<TableHeadCell>Court</TableHeadCell>
					<TableHeadCell>Home</TableHeadCell>
					<TableHeadCell>Away</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each tournament?.matches as match}
						<TableBodyRow>
							<TableBodyCell>{match.round}</TableBodyCell>
							<TableBodyCell>tbd</TableBodyCell>
							<TableBodyCell>{match.team1}</TableBodyCell>
							<TableBodyCell>{match.team2}</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{:else}
		No matches yet (hint start the tournament to see the schedule)
	{/if}
</div>
