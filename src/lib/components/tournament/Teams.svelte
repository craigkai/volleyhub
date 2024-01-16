<script lang="ts">
	import type { Teams } from '$lib/teams';
	import { success, error } from '$lib/toast';
	import type { HttpError } from '@sveltejs/kit';
	import { TableBody, TableBodyCell, TableBodyRow, TableSearch } from 'flowbite-svelte';

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

	let searchTerm: string = '';
	$: filteredTeams =
		teams?.teams?.filter(
			(team: TeamRow) => team.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
		) || [];
	let newTeamName = '';
</script>

<div class="block text-gray-700 text-sm font-bold">Teams:</div>
<TableSearch
	divClass="border-solid border-2 rounded"
	placeholder="Search by team name"
	striped={true}
	hoverable={true}
	bind:inputValue={searchTerm}
>
	<TableBody>
		{#each filteredTeams as team}
			<TableBodyRow>
				<TableBodyCell>{team.name}</TableBodyCell>
				<TableBodyCell>
					<button
						on:click={() => deleteTeam(team)}
						class="font-medium text-blue-600 hover:underline dark:text-primary-500">Delete</button
					></TableBodyCell
				>
			</TableBodyRow>
		{/each}
		<TableBodyRow>
			<TableBodyCell>
				<input
					on:keydown={(e) => {
						if (e?.key === 'Enter') {
							createTeam();
						}
					}}
					class="rounded rounded-lg text-black"
					name="newTeam"
					type="text"
					bind:value={newTeamName}
					placeholder="Add a new team..."
				/>
			</TableBodyCell>
			<TableBodyCell>
				<button
					on:click={createTeam}
					class="font-medium text-blue-600 hover:underline dark:text-primary-500"
					>Add new team</button
				></TableBodyCell
			>
		</TableBodyRow>
	</TableBody>
</TableSearch>
