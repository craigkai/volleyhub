<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import * as Select from '$components/ui/select/index.js';
	import { Matches } from '$lib/matches.svelte';
	import { closeModal, updateMatch } from '$lib/helper.svelte';
	import type { Brackets } from '$lib/brackets/brackets.svelte';
	import type { Teams } from '$lib/teams.svelte';
	import { error } from '@sveltejs/kit';

	let {
		matchId,
		matches = $bindable(),
		teams = $bindable()
	}: { matchId: number; matches: Matches | Brackets; teams: Teams } = $props();

	let match = matches?.matches?.find((m) => m.id === matchId);

	async function saveMatch() {
		try {
			await updateMatch(match, matches);
			closeModal();
		} catch (err) {
			console.error('Failed to save match:', err);
			error(500, 'Failed to save match');
		}
	}
</script>

{#snippet editTeam(match, teamNumber)}
	<div class="flex items-center space-x-4 mb-4">
		<Label class="min-w-[100px]" for="{teamNumber}-select">
			{teamNumber === 'team1' ? 'Home' : 'Away'} Team: {match[`public_matches_${teamNumber}_fkey`]
				.name}:
		</Label>

		<Select.Root
			selected={{
				value: match[teamNumber],
				label: match[`public_matches_${teamNumber}_fkey`].name
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
			class="border border-blue-500 rounded max-w-16 py-2 px-3 leading-tight text-center"
			id="team1-score-input"
			type="number"
			bind:value={match[`${teamNumber}_score`]}
		/>
	</div>
{/snippet}

{#if match}
	<div class="flex flex-col m-2 w-3/4">
		{@render editTeam(match, 'team1')}

		{@render editTeam(match, 'team2')}

		<button class="bg-blue-500 text-white py-2 px-4 rounded mt-4" onclick={saveMatch}>Save</button>
	</div>
{/if}
