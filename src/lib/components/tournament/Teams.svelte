<script lang="ts">
	import { success, error } from '$lib/toast';
	import type { Tournament } from '$lib/tournament';
	import type { HttpError_1 } from '@sveltejs/kit';
	import { TableBody, TableBodyCell, TableBodyRow, TableSearch } from 'flowbite-svelte';

	export let tournament: Tournament;
	// TODO: Handle alerting that adding or removing a team will wipe out
	// the current matches. Then make sure we actually do that.

	async function createTeam() {
		const newTeam: TeamRow = {
			name: newTeamName,
			event_id: tournament.id
		};
		tournament
			.createTeam(newTeam)
			.then(async () => {
				await loadEventTeams();
				success(`${newTeamName} created`);
				newTeamName = '';
			})
			.catch((err: HttpError_1) => error(err.body.message));
	}

	async function deleteTeam(team: TeamRow) {
		tournament
			.deleteTeam(team)
			.then(async () => {
				await loadEventTeams();
				success(`${team.name} deleted`);
			})
			.catch((err: HttpError_1) => error(err.body.message));
	}

	async function loadEventTeams() {
		const res = await tournament
			.loadEventTeams()
			.catch((err: HttpError_1) => error(err.body.message));

		tournament.settings.teams = res;
		tournament.matches = tournament.matches;
	}

	let searchTerm: string = '';
	$: filteredTeams = tournament?.settings?.teams?.filter(
		(team: TeamRow) => team.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
	);
	let newTeamName = '';
</script>

<div class="relative overflow-x-auto">
	<div class="block text-gray-700 text-sm font-bold">Teams:</div>
	<TableSearch
		divClass="border-solid border-2 rounded"
		placeholder="Search by maker name"
		striped={true}
		hoverable={true}
		bind:inputValue={searchTerm}
	>
		{#if filteredTeams && filteredTeams.length > 0}
			<TableBody>
				{#each filteredTeams as team}
					<TableBodyRow>
						<TableBodyCell>{team.name}</TableBodyCell>
						<TableBodyCell>
							<button
								on:click={() => deleteTeam(team)}
								class="font-medium text-blue-600 hover:underline dark:text-primary-500"
								>Delete</button
							></TableBodyCell
						>
					</TableBodyRow>
				{/each}
				<TableBodyRow>
					<TableBodyCell>
						<input
							class="rounded rounded-lg text-black"
							name="newTeam"
							type="text"
							bind:value={newTeamName}
							placeholder="Add a new team..."
						/>
					</TableBodyCell>
					<TableBodyCell>
						<button
							on:click={() => createTeam()}
							class="font-medium text-blue-600 hover:underline dark:text-primary-500"
							>Add new team</button
						></TableBodyCell
					>
				</TableBodyRow>
			</TableBody>
		{/if}
	</TableSearch>
</div>
