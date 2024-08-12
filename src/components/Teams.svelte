<script lang="ts">
	import { isHttpError, type HttpError } from '@sveltejs/kit';
	import * as Table from '$components/ui/table';
	import { Input } from '$components/ui/input/index.js';
	import type { Teams } from '$lib/teams.svelte';
	import toast from 'svelte-french-toast';
	import type { Matches } from '$lib/matches.svelte';

	const { teams = $bindable(), matches }: { teams: Teams; matches: Matches | undefined } = $props();

	async function createTeam() {
		if (teams.teams.findIndex((team) => team.name === newTeamName) !== -1) {
			toast.error('Team already exists');
			return;
		}

		try {
			const newTeam: Partial<TeamRow> = {
				name: newTeamName,
				event_id: teams.eventId
			};

			await teams.create(newTeam);
			await loadEventTeams();

			toast.success(`Team ${newTeamName} created`);
			newTeamName = '';
		} catch (err) {
			if (isHttpError(err)) {
				toast.error(err.body.message);
			} else {
				toast.error('Something went wrong');
			}
		}
	}

	async function deleteTeam(team: TeamRow) {
		try {
			await teams.delete(team);
			await loadEventTeams();
			toast.success(`Team ${team.name} deleted`);
		} catch (err: any) {
			toast.error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}

	async function loadEventTeams() {
		if (teams.eventId) {
			try {
				const res = await teams.load(teams.eventId);
				// @ts-ignore
				currentTeams = res;
			} catch (err) {
				if (isHttpError(err)) {
					toast.error(err.body.message);
				}
				toast.error('Something has gone very wrong');
			}
		}
	}
	let newTeamName = $state('');

	let currentTeams = $state(teams.teams ?? []);
</script>

<div class="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">Teams:</div>

<div class="rounded rounded-2xl p-2 dark:bg-gray-800">
	<Table.Root class="dark:bg-gray-800">
		<Table.Caption>A list of your teams.</Table.Caption>
		<Table.Body>
			{#each currentTeams ?? [] as team}
				<Table.Row>
					<Table.Cell>
						<Input
							class="input-field dark:bg-gray-700 dark:text-gray-200"
							id="team2-score-input"
							type="text"
							value={team.name}
							on:keypress={async (e) => {
								// if we hit enter
								if (e?.key === 'Enter') {
									const target = e.target as HTMLInputElement;
									if (target.value) {
										team.name = target.value;
										try {
											const res = await teams.update(team);
											if (res) {
												if (matches && matches.event_id) {
													await matches.load(matches.event_id);
												}

												toast.success(`Team ${team.name} updated`);
											}
										} catch (err: any) {
											toast.error((err as HttpError).toString());
										}
									}
								}
							}}
						/></Table.Cell
					>
					<Table.Cell
						><button onclick={() => deleteTeam(team)} class="action-button">Delete</button
						></Table.Cell
					>
				</Table.Row>
			{/each}
			<Table.Row>
				<Table.Cell>
					<Input
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
					></Input>
				</Table.Cell>
				<Table.Cell><button onclick={createTeam} class="action-button">Add</button></Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>

<style lang="postcss">
	.action-button {
		@apply font-medium text-blue-600 hover:underline;
	}
</style>
