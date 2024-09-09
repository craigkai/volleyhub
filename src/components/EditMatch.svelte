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

	type MatchKeys = 'team1' | 'team2' | 'team1_score' | 'team2_score';
	type ScoreKeys = 'team1_score' | 'team2_score';
</script>

{#snippet editEntity(entityType: string, entityId: MatchKeys, scoreProp?: ScoreKeys)}
	{@const entity = teams.teams.find((t: Team) => t.id === match[entityId])}
	<div class="mb-4 flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
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
			<Select.Trigger class="w-full md:w-[180px]">
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
			<div class="flex flex-col md:ml-4 md:flex-row md:items-center">
				<Label class="min-w-[50px]" for="{entityId}-score-input">Score:</Label>
				<Input
					class="mt-2 max-w-[100px] rounded border border-blue-500 px-3 py-2 text-center leading-tight md:ml-2 md:mt-0"
					id="{entityId}-score-input"
					type="number"
					bind:value={match[scoreProp]}
				/>
			</div>
		{/if}
	</div>
{/snippet}

{#if match}
	<div class="m-2 flex flex-col items-center justify-center">
		{@render editEntity('Home Team', 'team1', 'team1_score')}
		{@render editEntity('Away Team', 'team2', 'team2_score')}
		<button class="mt-4 rounded bg-blue-500 px-4 py-2 text-white" onclick={saveMatch}>Save</button>
		<button onclick={() => deleteMatch()} class="mt-2 text-red-500">Delete</button>
	</div>
{/if}
