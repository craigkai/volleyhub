<script lang="ts">
	import { Label } from '$components/ui/label/index.js';
	import { Input } from '$components/ui/input/index.js';
	import { Button } from '$components/ui/button';
	import * as Select from '$components/ui/select/index.js';
	import { updateMatch } from '$lib/helper.svelte';
	import { error } from '@sveltejs/kit';
	import toast from 'svelte-5-french-toast';
	import { Match } from '$lib/match.svelte';
	import { Team } from '$lib/team.svelte';
	import { PlayerStatsSupabaseDatabaseService } from '$lib/database/playerStats';

	let { matchId, matches, teams, playerStats } = $props();

	let match = matches?.matches?.find((m: { id: number }) => m.id === matchId) as Match;

	async function saveMatch() {
		try {
			// Automatically set match state based on whether both teams have scores
			const isComplete = match.team1_score != null && match.team2_score != null;
			if (isComplete) {
				match.state = 'COMPLETE';
			} else {
				match.state = 'INCOMPLETE';
			}

			const updatedMatch = await updateMatch(match);

			const team1 = updatedMatch
				? teams.teams.find((t: Team) => t.id === updatedMatch.team1)
				: null;
			const team2 = updatedMatch
				? teams.teams.find((t: Team) => t.id === updatedMatch.team2)
				: null;

			// Create player_stats for mix-and-match tournaments when match is completed
			if (isComplete && updatedMatch && team1 && team2 && matches.databaseService && playerStats) {
				const supabase = matches.databaseService.supabaseClient;
				const playerStatsService = new PlayerStatsSupabaseDatabaseService(supabase);

				// Remove existing player_stats for this match from local state (in case of re-scoring)
				if (playerStats.stats) {
					playerStats.stats = playerStats.stats.filter((s) => s.match_id !== updatedMatch.id);
				}

				// Delete existing player_stats for this match from database
				const { error: deleteError } = await supabase.from('player_stats').delete().eq('match_id', updatedMatch.id);
				if (deleteError) {
					console.error('Failed to delete existing player_stats for match:', deleteError);
					toast.error('Failed to update match: could not clear old player stats');
					return;
				}

				// Get players for team1
				const { data: team1Players } = await supabase
					.from('player_teams')
					.select('player_id')
					.eq('team_id', team1.id);

				// Get players for team2
				const { data: team2Players } = await supabase
					.from('player_teams')
					.select('player_id')
					.eq('team_id', team2.id);

				// Determine winner
				const team1Won = (updatedMatch.team1_score ?? 0) > (updatedMatch.team2_score ?? 0);

				const newStats: PlayerStatsRow[] = [];

				// Create stats for team1 players
				if (team1Players && team1Players.length > 0) {
					const team1Stats = team1Players.map((p) => ({
						player_id: p.player_id,
						event_id: updatedMatch.event_id,
						match_id: updatedMatch.id,
						win: team1Won,
						points_scored: updatedMatch.team1_score ?? 0,
						points_allowed: updatedMatch.team2_score ?? 0
					}));

					const created = await playerStatsService.createBatch(team1Stats);
					if (created) {
						newStats.push(...created);
					}
				}

				// Create stats for team2 players
				if (team2Players && team2Players.length > 0) {
					const team2Stats = team2Players.map((p) => ({
						player_id: p.player_id,
						event_id: updatedMatch.event_id,
						match_id: updatedMatch.id,
						win: !team1Won,
						points_scored: updatedMatch.team2_score ?? 0,
						points_allowed: updatedMatch.team1_score ?? 0
					}));

					const created = await playerStatsService.createBatch(team2Stats);
					if (created) {
						newStats.push(...created);
					}
				}

				// Update local playerStats state directly (no subscription needed)
				if (newStats.length > 0 && playerStats.stats) {
					playerStats.stats = [...playerStats.stats, ...newStats];
				}

				console.log(`Created player_stats for ${newStats.length} players`);
			}

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
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					bind:value={match[scoreProp]}
					oninput={(e) => {
						// Only allow numeric input
						const input = e.target as HTMLInputElement;
						input.value = input.value.replace(/[^0-9]/g, '');
						// Update the bound value
						if (scoreProp) {
							match[scoreProp] = input.value ? parseInt(input.value, 10) : null;
						}
					}}
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
