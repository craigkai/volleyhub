<script lang="ts">
	import { success, error } from '$lib/toast';
	import type { Tournament } from '$lib/tournament';
	import type { HttpError_1 } from '@sveltejs/kit';
	import { Table, TableBody, TableBodyCell, TableBodyRow } from 'flowbite-svelte';

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
				success(`$newTeamName created`);
			})
			.catch((err: HttpError_1) => error(err.body.message));
	}

	async function deleteTeam(team: TeamRow) {
		tournament
			.deleteTeam(team)
			.then(async () => {
				await loadEventTeams();
				success(team.name + ' deleted');
			})
			.catch((err: HttpError_1) => error(err.body.message));
	}

	async function loadEventTeams() {
		const res = await tournament
			.loadEventTeams()
			.catch((err: HttpError_1) => error(err.body.message));

		tournament.settings.teams = res;
	}

	let newTeamName = '';
</script>

<div class="block text-gray-700 text-sm font-bold mb-2">Teams:</div>

{#if tournament?.settings?.teams}
	<Table>
		<TableBody>
			{#each tournament.settings.teams as team}
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
	</Table>
{/if}
