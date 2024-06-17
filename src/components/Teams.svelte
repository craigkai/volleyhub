<script lang="ts">
	import type { Teams } from '$lib/teams.svelte';
	import { success, error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import { TableBody, TableBodyCell, TableBodyRow, Table } from 'flowbite-svelte';
	import { Input } from 'flowbite-svelte';

	let { teams }: { teams: Teams } = $props();

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
	let newTeamName = $state('');
</script>

<div class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Teams:</div>

<Table class="min-w-full bg-white dark:bg-gray-800">
	<TableBody>
		{#each teams?.teams as team}
			<TableBodyRow class="border-b dark:border-gray-700">
				<TableBodyCell class="px-4 py-2 dark:text-gray-300">{team.name}</TableBodyCell>
				<TableBodyCell class="px-4 py-2 text-right">
					<button onclick={() => deleteTeam(team)} class="action-button">Delete</button>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
		<TableBodyRow class="border-t dark:border-gray-700">
			<TableBodyCell class="px-4 py-2">
				<Input
					size="sm"
					type="text"
					id="newTeam"
					class="input-field dark:bg-gray-700 dark:text-gray-200"
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
				<button onclick={createTeam} class="action-button">Add</button>
			</TableBodyCell>
		</TableBodyRow>
	</TableBody>
</Table>

<style>
	.action-button {
		@apply font-medium text-blue-600 hover:underline dark:text-blue-400;
	}

	.input-field {
		@apply w-full border rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:border-gray-600 dark:focus:ring-blue-400;
	}
</style>
