<script lang="ts">
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';

	export let schedule: any;
</script>

<div class="flex flex-row w-full">
	{#if schedule?.players}
		<div class="w-1/2 m-1">
			<Table>
				<TableHead>
					<TableHeadCell>Teams</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each schedule?.players as team}
						<TableBodyRow>
							<TableBodyCell>{team.name}</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{/if}

	{#if schedule?.matches}
		<div class="w-1/2 m-1">
			<Table>
				<TableHead>
					<TableHeadCell>Round</TableHeadCell>
					<TableHeadCell>Court</TableHeadCell>
					<TableHeadCell>Home</TableHeadCell>
					<TableHeadCell>Away</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each schedule?.matches as match}
						<TableBodyRow>
							<TableBodyCell>{match.round}</TableBodyCell>
							<TableBodyCell>{JSON.stringify(match.meta)}</TableBodyCell>
							<TableBodyCell
								>{schedule.players.find((player) => player.id === match.player1.id)
									?.name}</TableBodyCell
							>
							<TableBodyCell
								>{schedule.players.find((player) => player.id === match.player2.id)
									?.name}</TableBodyCell
							>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{:else}
		No matches yet (hint start the tournament to see the schedule)
	{/if}
</div>
