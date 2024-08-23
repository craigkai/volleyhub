<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import * as Select from '$components/ui/select/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import type { Brackets } from '$lib/brackets/brackets.svelte';
	import type { Teams } from '$lib/teams.svelte';
	import { error } from '@sveltejs/kit';
	import toast from 'svelte-french-toast';
	import { Match } from '$lib/match.svelte';
	import { Team } from '$lib/team.svelte';
	import type { Pool } from '$lib/pool/pool.svelte';

	let {
		matchId,
		matches,
		teams,
		open
	}: { matchId: number; matches: Pool | Brackets; teams: Teams; open: boolean } = $props();

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
		} catch (err) {
			console.error('Failed to save match:', err);
			error(500, 'Failed to save match');
		}
	}

	// Function to delete an existing match with confirmation
	async function deleteMatch() {
		const confirmation = window.confirm(
			'Are you sure you want to delete this match? This action cannot be undone.'
		);

		if (confirmation) {
			try {
				await match.delete();
				matches.matches = matches.matches.filter((m: Match) => m.id !== match.id);

				open = false;
				toast.success('Match deleted successfully');
			} catch (err) {
				toast.error('Failed to delete match');
			}
		} else {
			toast('Match deletion canceled');
		}
	}
</script>

{#snippet editEntity(entityType: string, entityId: string, scoreProp?: string)}
	{@const entity = teams.teams.find((t: Team) => t.id === match[entityId])}
	<div class="mb-4 flex items-center space-x-4">
		<Label class="min-w-[100px]" for="{entityId}-select">
			{entityType}: {entity?.name}:
		</Label>

		<Select.Root
			selected={{
				value: match[entityId],
				label: entity?.name
			}}
			onSelectedChange={(event) => (match[entityId] = event?.value)}
		>
			<Select.Trigger class="w-[180px]">
				<Select.Value placeholder="{entityType}..." />
			</Select.Trigger>
			<Select.Content>
				{#each teams.teams as team}
					<Select.Item value={team.id} label={team.name}>{team.name}</Select.Item>
				{/each}
			</Select.Content>
			<Select.Input name="{entityId}-select" />
		</Select.Root>

		{#if scoreProp}
			<Label class="ml-4 min-w-[50px]" for="{entityId}-score-input">Score:</Label>
			<Input
				class="max-w-16 rounded border border-blue-500 px-3 py-2 text-center leading-tight"
				id="{entityId}-score-input"
				type="number"
				bind:value={match[scoreProp]}
			/>
		{/if}
	</div>
{/snippet}

{#if match}
	<div class="m-2 flex w-3/4 flex-col">
		{@render editEntity('Home Team', 'team1', 'team1_score')}
		{@render editEntity('Away Team', 'team2', 'team2_score')}
		<button class="mt-4 rounded bg-blue-500 px-4 py-2 text-white" onclick={saveMatch}>Save</button>
		<button onclick={() => deleteMatch()} class="text-red-500"> Delete </button>
	</div>
{/if}
