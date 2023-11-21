<script lang="ts">
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import Edit from './Edit.svelte';

	export let schedule: any;
	export let teams: string;
	export let courts: number;
	export let pools: number;
	export let setSchedule: () => void;
</script>

<Edit {teams} {courts} {pools} {setSchedule} />

<Table>
	<TableHead>
		<TableHeadCell>Round</TableHeadCell>
		<TableHeadCell>Court</TableHeadCell>
		<TableHeadCell>Home</TableHeadCell>
		<TableHeadCell>Away</TableHeadCell>
	</TableHead>
	<TableBody>
		{#each schedule.matches as match}
			<TableBodyRow>
				<TableBodyCell>{match.round}</TableBodyCell>
				<TableBodyCell>{JSON.stringify(match.meta)}</TableBodyCell>
				<TableBodyCell
					>{schedule.players.find((player) => player.id === match.player1.id)?.name}</TableBodyCell
				>
				<TableBodyCell
					>{schedule.players.find((player) => player.id === match.player2.id)?.name}</TableBodyCell
				>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
