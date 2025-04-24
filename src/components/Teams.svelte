<script lang="ts">
	import { isHttpError, type HttpError } from '@sveltejs/kit';
	import * as Table from '$components/ui/table';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button';
	import type { Teams } from '$lib/teams.svelte';
	import toast from 'svelte-french-toast';
	import { Team } from '$lib/team.svelte';
	import type { Matches } from '$lib/matches.svelte';
	import UsersIcon from 'lucide-svelte/icons/users';
	import PlusIcon from 'lucide-svelte/icons/plus';
	import TrashIcon from 'lucide-svelte/icons/trash-2';
	import EditIcon from 'lucide-svelte/icons/edit-2';
	import SaveIcon from 'lucide-svelte/icons/check';
	import type { TeamRow } from '$lib/types';

	const { teams = $bindable(), matches }: { teams: Teams; matches: Matches } = $props();

	async function createTeam() {
		if (!newTeamName.trim()) {
			toast.error('Team name cannot be empty');
			return;
		}

		if (teams.teams.findIndex((team) => team.name === newTeamName) !== -1) {
			toast.error('Team already exists');
			return;
		}

		try {
			const newTeam: Partial<TeamRow> = {
				name: newTeamName,
				event_id: teams.eventId
			};

			const newTeamInstance = await teams.create(newTeam);
			if (newTeamInstance) teams.teams.push(newTeamInstance);

			// Clear out matches
			if (matches) await matches.deleteAllMatches();

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

	async function deleteTeam(team: Team) {
		try {
			await team.delete(team);
			teams.teams.splice(
				teams.teams.findIndex((t) => t.id === team.id),
				1
			);

			// Clear out matches
			if (matches) await matches.deleteAllMatches();

			toast.success(`Team ${team.name} deleted`);
		} catch (err: any) {
			toast.error(err?.body?.message ?? `Something went wrong: ${err}`);
		}
	}

	async function updateTeam(team: Team) {
		if (!team.name.trim()) {
			toast.error('Team name cannot be empty');
			return;
		}

		try {
			const res = await team.update(team);
			if (res) {
				toast.success(`Team ${team.name} updated`);
				editingTeamId = null;
			}
		} catch (err: any) {
			toast.error((err as HttpError).toString());
		}
	}

	let newTeamName = $state('');
	let editingTeamId = $state<string | number | null>(null);
	let currentTeams = $state(teams.teams ?? []);
</script>

<div class="space-y-4">
	<div class="flex items-center gap-2">
		<UsersIcon class="h-5 w-5 text-emerald-600" />
		<h2 class="text-lg font-semibold text-gray-800 dark:text-white">Teams Management</h2>
	</div>

	<div
		class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="p-4">
			<div class="mb-4 flex items-center gap-3">
				<Input
					type="text"
					id="newTeam"
					class="h-10 rounded-lg border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
					placeholder="Enter new team name"
					on:keydown={(e) => {
						if (e?.key === 'Enter') {
							createTeam();
						}
					}}
					bind:value={newTeamName}
				/>
				<Button
					onclick={createTeam}
					class="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none dark:bg-emerald-600 dark:hover:bg-emerald-700"
				>
					<PlusIcon class="h-4 w-4" />
					<span>Add Team</span>
				</Button>
			</div>

			{#if currentTeams.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-8 text-center dark:border-gray-600"
				>
					<UsersIcon class="mb-2 h-10 w-10 text-gray-400 dark:text-gray-500" />
					<h3 class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">No teams yet</h3>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Add your first team using the field above
					</p>
				</div>
			{:else}
				<div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
					<Table.Root class="w-full">
						<Table.Header>
							<Table.Row class="bg-gray-50 dark:bg-gray-900">
								<Table.Head
									class="w-full py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
									>Team Name</Table.Head
								>
								<Table.Head
									class="w-24 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300"
									>Actions</Table.Head
								>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each currentTeams as team (team.id)}
								<Table.Row
									class="border-t border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
								>
									<Table.Cell class="py-3">
										{#if editingTeamId === team.id}
											<div class="flex items-center gap-2">
												<Input
													class="h-9 rounded border-gray-300 bg-white text-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
													type="text"
													bind:value={team.name}
													on:keydown={(e) => {
														if (e?.key === 'Enter') {
															updateTeam(team);
														} else if (e?.key === 'Escape') {
															editingTeamId = null;
														}
													}}
												/>
												<Button
													onclick={() => updateTeam(team)}
													class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white p-0 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
													title="Save"
												>
													<SaveIcon class="h-4 w-4" />
												</Button>
											</div>
										{:else}
											<div class="flex items-center justify-between">
												<span class="font-medium text-gray-800 dark:text-gray-200">{team.name}</span
												>
												<Button
													onclick={() => (editingTeamId = team.id)}
													class="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
													title="Edit"
												>
													<EditIcon class="h-3.5 w-3.5" />
												</Button>
											</div>
										{/if}
									</Table.Cell>
									<Table.Cell class="py-3 text-right">
										<Button
											onclick={() => deleteTeam(team)}
											class="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 focus:ring-2 focus:ring-red-500/20 focus:outline-none dark:border-red-800 dark:bg-transparent dark:text-red-500 dark:hover:bg-red-900/30"
											title="Delete team"
										>
											<TrashIcon class="h-3.5 w-3.5" />
											<span>Delete</span>
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Smooth transitions for hover states */
	button,
	input {
		transition: all 0.2s ease;
	}

	/* Focus styles for better accessibility */
	:global(button:focus-visible),
	:global(input:focus-visible) {
		outline: 2px solid rgb(16 185 129 / 0.5);
		outline-offset: 2px;
	}
</style>
