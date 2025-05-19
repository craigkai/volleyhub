<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import * as Select from '$components/ui/select/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import type { Brackets } from '$lib/brackets/brackets.svelte';
	import type { Teams } from '$lib/teams.svelte';
	import { error } from '@sveltejs/kit';
	import toast from 'svelte-5-french-toast';
	import { Match } from '$lib/match.svelte';
	import { Team } from '$lib/team.svelte';
	import type { Pool } from '$lib/pool/pool.svelte';
	import { Button } from './ui/button';

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
	<div class="mb-6 flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
		<Label class="min-w-[100px] font-medium text-white" for="{entityId}-select">
			{entityType}:
		</Label>

		<Select.Root
			type="single"
			onValueChange={(value) => {
				if (value) {
					match[entityId] = parseInt(value, 10);
				}
			}}
		>
			<Select.Trigger
				class="w-full border-gray-600 bg-gray-700 text-white hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 md:w-[180px]"
				>{entity?.name}</Select.Trigger
			>
			<Select.Content class="border border-gray-700 bg-gray-800 text-white">
				{#each teams.teams as team}
					{#if team.id}
						<Select.Item value={team.id.toString()} label={team.name} class="hover:bg-gray-700"
							>{team.name}</Select.Item
						>
					{/if}
				{/each}
			</Select.Content>
		</Select.Root>

		{#if scoreProp}
			<div class="flex flex-col md:ml-4 md:flex-row md:items-center">
				<Label class="min-w-[50px] font-medium text-white" for="{entityId}-score-input"
					>Score:</Label
				>
				<Input
					class="mt-2 max-w-[100px] rounded border border-blue-500 bg-gray-700 px-3 py-2 text-center leading-tight text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400 md:mt-0 md:ml-2"
					id="{entityId}-score-input"
					type="number"
					bind:value={match[scoreProp]}
				/>
			</div>
		{/if}
	</div>
{/snippet}

{#if match}
	<div class="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
		<h2 class="mb-6 text-center text-xl font-bold text-white">Edit Match</h2>

		<div class="space-y-6">
			{@render editEntity('Home Team', 'team1', 'team1_score')}
			{@render editEntity('Away Team', 'team2', 'team2_score')}
		</div>

		<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<Button
				class="w-full rounded-md bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none sm:w-auto"
				onclick={saveMatch}
			>
				Save Changes
			</Button>

			<Button
				onclick={() => deleteMatch()}
				class="mt-2 w-full rounded-md bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none sm:mt-0 sm:w-auto"
			>
				Delete Match
			</Button>
		</div>
	</div>
{/if}
