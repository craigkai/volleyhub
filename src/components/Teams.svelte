<script lang="ts">
	import type { Teams } from '$lib/teams';
	import { success, error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import { TableBody, TableBodyCell, TableBodyRow, Table } from 'flowbite-svelte';
	import { Input } from 'flowbite-svelte';

	export let teams: Teams;

	async function createTeam() {
		try {
			const newTeam: Partial<TeamRow> = {
				name: newTeamName,
				event_id: teams.event_id
			};
			await teams.create(newTeam);
			await loadEventTeams();
			success(`Team ${newTeamName} created`);
			newTeamName = '';
		} catch (err: any) {
			error((err as HttpError).toString());
		}
	}

	async function deleteTeam(team: TeamRow) {
		try {
			await teams.delete(team);
			await loadEventTeams();
			success(`Team ${team.name} deleted`);
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

<div class="block text-gray-700 text-sm font-bold mb-2">Teams:</div>

<Table class="min-w-full bg-white">
	<TableBody>
		{#each teams?.teams as team}
			<TableBodyRow class="border-b">
				<TableBodyCell class="px-4 py-2">{team.name}</TableBodyCell>
				<TableBodyCell class="px-4 py-2 text-right">
					<button on:click={() => deleteTeam(team)} class="action-button">Delete</button>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
		<TableBodyRow class="border-t">
			<TableBodyCell class="px-4 py-2">
				<Input
					size="sm"
					type="text"
					id="newTeam"
					class="input-field"
					placeholder="Enter new team name"
					on:keydown={(e) => {
						if (e?.key === 'Enter') {
							createTeam();
						}
					}}
					bind:value={newTeamName}
				/>
			</TableBodyCell>
			<TableBodyCell class="px-4 py-2 text-right">
				<button on:click={createTeam} class="action-button">Add</button>
			</TableBodyCell>
		</TableBodyRow>
	</TableBody>
</Table>

<style>
	.action-button {
		@apply font-medium text-blue-600 hover:underline;
	}

	.input-field {
		@apply w-full border rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
	}
</style>
