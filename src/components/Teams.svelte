<script lang="ts">
	import type { Teams } from '$lib/teams.svelte';
	import { success, error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import * as Table from '$components/ui/table';

	let { teams = $bindable() }: { teams: Teams } = $props();

	async function createTeam() {
		if (teams.teams.findIndex((team) => team.name === newTeamName) !== -1) {
			error('Team already exists');
			return;
		}

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
		teams
			.load()
			.catch((err: HttpError) => error(err.body.message))
			.then(() => (teams = teams))
			.catch((err: HttpError) => error(err.body.message));
	}
	let newTeamName = $state('');
</script>

<div class="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Teams:</div>

<Table.Root class="min-w-full bg-white dark:bg-gray-800">
	<Table.Caption>A list of your teams.</Table.Caption>
	<Table.Body>
		{#each teams?.teams as team}
			<Table.Row>
				<Table.Cell>{team.name}</Table.Cell>
				<Table.Cell
					><button onclick={() => deleteTeam(team)} class="action-button">Delete</button
					></Table.Cell
				>
			</Table.Row>
		{/each}
		<Table.Row>
			<Table.Cell
				><input
					type="text"
					id="newTeam"
					class="input-field dark:bg-gray-700 dark:text-gray-200"
					placeholder="Enter new team name"
					onkeydown={(e) => {
						if (e?.key === 'Enter') {
							createTeam();
						}
					}}
					bind:value={newTeamName}
				/>
			</Table.Cell>
			<Table.Cell><button onclick={createTeam} class="action-button">Add</button></Table.Cell>
		</Table.Row>
	</Table.Body>
</Table.Root>

<style>
	.action-button {
		@apply font-medium text-blue-600 hover:underline dark:text-blue-400;
	}

	.input-field {
		@apply w-full border rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200 dark:border-gray-600 dark:focus:ring-blue-400;
	}
</style>
