<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import * as Select from '$components/ui/select/index.js';
	import { closeModal, updateMatch } from '$lib/helper.svelte';
	import type { Brackets } from '$lib/brackets/brackets.svelte';
	import type { Teams } from '$lib/teams.svelte';
	import { error } from '@sveltejs/kit';
	import type { Pool } from '$lib/pool/pool.svelte';
	import { Team } from '$lib/team.svelte';
	import toast from 'svelte-french-toast';
	import { Match } from '$lib/match.svelte';

	let { matchId, matches, teams }: { matchId: number; matches: Pool | Brackets; teams: Teams } =
		$props();

	let match = matches?.matches?.find((m) => m.id === matchId) as Match;

	async function saveMatch() {
		try {
			const updatedMatch = await updateMatch(match);

			const team1 = updatedMatch
				? teams.teams.find((t: Team) => t.id === updatedMatch.team1)
				: null;
			const team2 = updatedMatch
				? teams.teams.find((t: Team) => t.id === updatedMatch.team2)
				: null;

			toast.success(`Match ${team1?.name} vs ${team2?.name} updated`);
			closeModal();
		} catch (err) {
			console.error('Failed to save match:', err);
			error(500, 'Failed to save match');
		}
	}
</script>

{#snippet editTeam(match: Match, teamNumber: string)}
	{@const team = teams.teams.find((t: Team) => t.id === match[teamNumber])}

	<div class="mb-4 flex items-center space-x-4">
		<Label class="min-w-[100px]" for="{teamNumber}-select">
			{teamNumber === 'team1' ? 'Home' : 'Away'} Team: {team?.name}:
		</Label>

		<Select.Root
			selected={{
				// @ts-ignore
				value: match[teamNumber],
				label: team?.name
			}}
			onSelectedChange={(event) => (match[teamNumber] = event?.value)}
		>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="team..." />
			</Select.Trigger>
			<Select.Content>
				{#each teams.teams as team}
					<Select.Item value={team.id} label={team.name}>{team.name}</Select.Item>
				{/each}
			</Select.Content>
			<Select.Input name="{teamNumber}-select" />
		</Select.Root>

		<Label class="ml-4 min-w-[50px]" for="team1-score-input">Score:</Label>
		<Input
			class="max-w-16 rounded border border-blue-500 px-3 py-2 text-center leading-tight"
			id="team1-score-input"
			type="number"
			bind:value={match[`${teamNumber}_score`]}
		/>
	</div>
{/snippet}

{#if match}
	<div class="m-2 flex w-3/4 flex-col">
		{@render editTeam(match, 'team1')}

		{@render editTeam(match, 'team2')}

		<button class="mt-4 rounded bg-blue-500 px-4 py-2 text-white" onclick={saveMatch}>Save</button>
	</div>
{/if}
