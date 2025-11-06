<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import * as Select from '$components/ui/select/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import toast from 'svelte-5-french-toast';
	import type { Team } from '$lib/team.svelte';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';
	import Button from '$components/ui/button/button.svelte';

	let { matchesPerRound, teams, defaultTeam, readOnly } = $props();

	let match = $derived(matchesPerRound ? matchesPerRound[0] : null);

	// use string to match Select.Item values
	let selectedRefId = $derived(match?.ref?.toString() ?? '');

	// derived team from selected ID
	let refTeam = $derived(teams.teams.find((t: Team) => t.id?.toString() === selectedRefId));

	// Filter out teams that are playing in this match using match_teams table
	let availableRefTeams = $derived(
		teams.teams.filter((t: Team) => {
			// Get team IDs from match_teams table
			if (!match?.match_teams || !Array.isArray(match.match_teams)) {
				return true; // If no match_teams data, allow all teams
			}
			const matchTeamIds = new Set(match.match_teams.map((mt: { team_id: number }) => mt.team_id));
			return !matchTeamIds.has(t.id);
		})
	);

	async function saveRef() {
		const parsedRef = parseInt(selectedRefId, 10);

		if (match && !isNaN(selectedRefId)) {
			try {
				for (let m of matchesPerRound) {
					m.ref = parsedRef;
					const updatedMatch = await updateMatch(m);

					if (!updatedMatch) {
						toast.error('Failed to save referee');
						return;
					}

					match.ref = updatedMatch.ref;
					match = updatedMatch;

					// Get team names from match_teams for the success message
					let teamNames: string[] = [];
					if (updatedMatch.match_teams && Array.isArray(updatedMatch.match_teams)) {
						teamNames = updatedMatch.match_teams
							.map((mt: { team_id: number }) => {
								const team = teams.teams.find((t: Team) => t.id === mt.team_id);
								return team?.name || 'Unknown';
							})
							.filter((name: string) => name !== 'Unknown');
					}
					
					const matchDescription = teamNames.length > 0 
						? teamNames.join(' vs ')
						: `Match ${updatedMatch.id}`;

					toast.success(`Referee updated for match ${matchDescription}`);
				}
			} catch (err) {
				console.error('Failed to save referee:', err);
				toast.error('Failed to save referee');
			}
		} else {
			toast.error('Please select a referee');
		}
	}
</script>

<div
	class="rounded-lg {refTeam?.name === defaultTeam
		? 'border-2 border-solid border-yellow-300 bg-yellow-200 dark:border-yellow-600 dark:bg-gray-700 dark:text-white'
		: 'border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white'}"
>
	{#if readOnly}
		<div class="text-center font-medium">
			{refTeam?.name || 'TBD'}
		</div>
	{:else}
		<AlertDialog.Root>
			<AlertDialog.Trigger
				class="w-full rounded px-2 py-1 text-center font-medium transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:hover:bg-gray-700"
			>
				{refTeam?.name || 'TBD'}
			</AlertDialog.Trigger>

			<AlertDialog.Content
				class="w-full max-w-md border bg-white p-0 dark:border-gray-700 dark:bg-gray-800"
				interactOutsideBehavior="close"
			>
				<div class="flex flex-col items-center justify-center p-6">
					<Label class="mb-6 text-xl font-semibold text-gray-900 dark:text-white"
						>Select Referee</Label
					>

					<Select.Root bind:value={selectedRefId} type="single">
						<Select.Trigger
							class="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 md:w-[220px] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
						>
							{refTeam?.name || 'Select Referee'}
						</Select.Trigger>

						<Select.Content
							class="border border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
						>
							{#each availableRefTeams as team}
								<Select.Item
									value={team.id.toString()}
									label={team.name}
									class="hover:bg-gray-100 dark:hover:bg-gray-700"
								>
									{team.name}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					<div class="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
						<Button
							class="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none sm:w-auto"
							onclick={saveRef}
						>
							Save Referee
						</Button>

						<AlertDialog.Cancel
							class="mt-2 w-full rounded-md bg-gray-200 px-6 py-3 font-medium text-gray-800 transition-colors hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none sm:mt-0 sm:w-auto dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							Cancel
						</AlertDialog.Cancel>
					</div>
				</div>
			</AlertDialog.Content>
		</AlertDialog.Root>
	{/if}
</div>
