<script lang="ts">
	import type { Teams } from '$lib/teams';
	import { success, error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import { TableBody, TableBodyCell, TableBodyRow, Table } from 'flowbite-svelte';
	import { Input, Label } from 'flowbite-svelte';

	export let teams: Teams;

	async function createTeam() {
		try {
			const newTeam: Partial<TeamRow> = {
				name: newTeamName,
				event_id: teams.event_id
			};
			await teams.create(newTeam);
			await loadEventTeams();
			success(`${newTeamName} created`);
			newTeamName = '';
		} catch (err: any) {
			error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}

	async function deleteTeam(team: TeamRow) {
		try {
			await teams.delete(team);
			await loadEventTeams();
			success(`team ${team.name} deleted`);
		} catch (err: any) {
			error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}

	async function loadEventTeams() {
		const res = await teams.load().catch((err: HttpError) => error(err.body.message));

		teams.teams = res || [];
	}
	let newTeamName = '';
</script>

<div class="block text-gray-700 text-sm font-bold">Teams:</div>

<Table>
	<TableBody>
		{#each teams?.teams as team}
			<TableBodyRow>
				<TableBodyCell colspan="1">{team.name}</TableBodyCell>
				<TableBodyCell colspan="1">
					<button
						on:click={() => deleteTeam(team)}
						class="font-medium text-blue-600 hover:underline dark:text-primary-500">Delete</button
					></TableBodyCell
				>
			</TableBodyRow>
		{/each}
		<TableBodyRow>
			<TableBodyCell colspan="1">
				<Input
					size="sm"
					type="text"
					id="newTeam"
					on:keydown={(e) => {
						if (e?.key === 'Enter') {
							createTeam();
						}
					}}
					bind:value={newTeamName}
				/>
			</TableBodyCell>
			<TableBodyCell colspan="1">
				<button
					on:click={createTeam}
					class="font-medium text-blue-600 hover:underline dark:text-primary-500">add</button
				></TableBodyCell
			>
		</TableBodyRow>
	</TableBody>
</Table>
