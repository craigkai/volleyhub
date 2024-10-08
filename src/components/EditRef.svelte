<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import * as Select from '$components/ui/select/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import toast from 'svelte-french-toast';
	import type { Team } from '$lib/team.svelte';
	import type { Match } from '$lib/match.svelte';
	import type { Teams } from '$lib/teams.svelte';
	import * as AlertDialog from '$components/ui/alert-dialog/index.js';

	let { matchesPerRound, teams, defaultTeam, readOnly } = $props<{
		defaultTeam: String | null;
		matchesPerRound: Match[];
		teams: Teams;
		readOnly: boolean;
	}>();

	// Select the first match in the round as the reference match
	let match = $state(matchesPerRound ? matchesPerRound[0] : null);
	let selectedRef = $state({
		get ref() {
			return match?.ref ?? null;
		},
		set ref(ref: number) {
			match.ref = ref;
		}
	});
	let open = $state(false);

	// Ref is recalculated whenever match.ref or teams changes
	let ref = $derived(teams.teams.find((t: Team) => t.id === match?.ref));

	// Save the referee for both team1 and team2 in the match
	async function saveRef() {
		if (match && selectedRef.ref !== null) {
			try {
				for (let m of matchesPerRound) {
					m.ref = selectedRef.ref;
					const updatedMatch = await updateMatch(m);

					if (!updatedMatch) {
						toast.error('Failed to save referee');
						return;
					}

					match.ref = updatedMatch.ref;
					match = updatedMatch;

					const team1 = teams.teams.find((t: Team) => t.id === updatedMatch.team1);
					const team2 = teams.teams.find((t: Team) => t.id === updatedMatch.team2);

					toast.success(`Referee updated for match ${team1?.name} vs ${team2?.name}`);
				}

				open = false;
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
	class="rounded rounded-lg p-2 {ref?.name === defaultTeam
		? 'flex-1 border-2 border-solid border-yellow-300 bg-yellow-200 dark:border-gray-400 dark:bg-gray-400'
		: 'flex-1'}"
>
	{#if readOnly}
		<div>
			{ref?.name}
		</div>
	{:else}
		<button class="cursor-pointer" onclick={() => (open = true)}>
			{ref?.name}
		</button>
	{/if}
</div>

<AlertDialog.Root
	bind:open
	closeOnOutsideClick={true}
	closeOnEscape={true}
	onOpenChange={() => (open = false)}
>
	<AlertDialog.Content>
		<div class="m-2 flex flex-col items-center justify-center">
			<Label class="mb-4 text-lg font-semibold">Select Referee:</Label>
			<Select.Root
				selected={{
					value: selectedRef.ref,
					label: teams.teams.find((t: Team) => t.id === selectedRef.ref)?.name
				}}
				onSelectedChange={(event) => (selectedRef.ref = event?.value as number)}
			>
				<Select.Trigger class="mx-auto w-[180px]">
					<!-- Add mx-auto for horizontal centering -->
					<Select.Value placeholder="Select a referee..." />
				</Select.Trigger>
				<Select.Content>
					{#each teams.teams as team}
						<Select.Item value={team.id} label={team.name}>{team.name}</Select.Item>
					{/each}
				</Select.Content>
				<Select.Input name="ref-select" />
			</Select.Root>

			<button class="mt-4 rounded bg-blue-500 px-4 py-2 text-white" onclick={saveRef}>
				Save Referee
			</button>
		</div>
	</AlertDialog.Content>
</AlertDialog.Root>
